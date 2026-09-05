import json
import re
from typing import Dict, Any, Optional
from openai import OpenAI
from pydantic import ValidationError
from app.config import settings
from app.schemas import ConceptualProjectIdea, FORBIDDEN_IMPLEMENTATION_TERMS

SYSTEM_PROMPT = """You are the Cognitive Idea Distiller & Scientific Abstraction Agent.
Your SOLE objective is to take project proposals, technical reports, or problem documents and distill them into pure conceptual overviews.

You must extract ONLY the theoretical hypothesis, fundamental friction, and measurable impact.

STRICT NEGATIVE CONSTRAINT:
You MUST NOT output any:
- Programming languages (e.g. Python, Java, JavaScript, C++)
- Web/app frameworks (e.g. React, FastAPI, Node.js, Spring)
- Hardware, microcontrollers, sensor names, or pinouts (e.g. ESP32, Arduino, Raspberry Pi, STM32, GPIO, PCB)
- Protocols or cloud vendors (e.g. MQTT, HTTP, AWS, Supabase, Bluetooth, Wi-Fi)
- Database names or specific model architectures (e.g. SQL, MongoDB, CNN, YOLO, LSTM, Transformers)
- Procedural step-by-step implementation instructions.

Instead, describe the underlying principle (e.g., "Edge-computed distributed sensor telemetry" instead of "ESP32 reading sensors via MQTT", "Decentralized state consensus" instead of "PostgreSQL on AWS", "Multi-spectral optical anomaly detection" instead of "YOLOv8 CNN in PyTorch").

You MUST return a VALID JSON object with EXACTLY these 5 fields:
{
  "title": "Abstract Conceptual Title",
  "domain": "High-Level Domain",
  "problem_statement": "The fundamental systemic friction, bottleneck, or challenge addressed.",
  "conceptual_vision": "The theoretical hypothesis, conceptual mechanism, or systemic approach (ZERO how-to, ZERO tech stack).",
  "intended_impact": "Measurable human, economic, ecological, or systemic outcome."
}
"""

def heuristic_purifier(text: str) -> str:
    """
    Strips and paraphrases forbidden implementation terminology when sanitizing text.
    """
    purified = text
    replacements = {
        r'\besp32\b': 'embedded edge computing unit',
        r'\besp8266\b': 'low-power telemetry transceiver',
        r'\barduino\b': 'programmable processing controller',
        r'\braspberry pi\b': 'compact computational node',
        r'\bmqtt\b': 'asynchronous publish-subscribe messaging protocol',
        r'\bbluetooth\b': 'short-range wireless telemetry',
        r'\bwifi\b': 'local-area wireless network channel',
        r'\bpython\b': 'computational logic',
        r'\bfastapi\b': 'service interface',
        r'\breact\b': 'graphical interaction interface',
        r'\bsql\b': 'structured relational store',
        r'\bcnn\b': 'spatial feature extraction network',
        r'\btransformer\b': 'attention-based contextual representation mechanism',
        r'\byolo\b': 'real-time object boundary localizer',
        r'\bpinout\b': 'interface mapping',
        r'\bgpio\b': 'general input-output channel',
        r'\baws\b': 'distributed computing infrastructure',
        r'\bcloud\b': 'centralized computing infrastructure',
        r'\bmicrocontroller\b': 'dedicated edge processor'
    }
    for pattern, rep in replacements.items():
        purified = re.sub(pattern, rep, purified, flags=re.IGNORECASE)
    
    for term in FORBIDDEN_IMPLEMENTATION_TERMS:
        pattern = r'\b' + re.escape(term) + r'\b'
        purified = re.sub(pattern, 'conceptual subsystem', purified, flags=re.IGNORECASE)
        
    return purified.strip()


class IdeaDistillerAgent:
    def __init__(self):
        self.client = None
        if settings.NVIDIA_API_KEY:
            self.client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=settings.NVIDIA_API_KEY
            )
            self.model = "meta/llama-3.2-11b-vision-instruct"
        elif settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4o-mini"
        elif settings.GROQ_API_KEY:
            self.client = OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=settings.GROQ_API_KEY
            )
            self.model = "llama-3.1-8b-instant"

    def distill(self, raw_text: str, max_critique_attempts: int = 3) -> ConceptualProjectIdea:
        """
        Executes distillation with a self-critique loop against the Pydantic schema validator.
        """
        if not raw_text or len(raw_text.strip()) < 10:
            return ConceptualProjectIdea(
                title="Untitled Abstract Concept",
                domain="Interdisciplinary Science & Technology",
                problem_statement="Unspecified domain challenge requiring systematic intervention.",
                conceptual_vision="Hypothesis-driven algorithmic mechanism for optimizing systemic workflows.",
                intended_impact="General efficiency improvements across operational metrics."
            )

        truncated_input = raw_text[:4000]
        critique_feedback = ""
        
        for attempt in range(max_critique_attempts):
            try:
                raw_json_str = self._call_llm(truncated_input, critique_feedback)
                data_dict = self._parse_json(raw_json_str)
                
                # Sanitize any accidental string slips
                for k, v in data_dict.items():
                    if isinstance(v, str):
                        data_dict[k] = heuristic_purifier(v)
                
                # Validate against Pydantic V2 Model
                concept = ConceptualProjectIdea.model_validate(data_dict)
                return concept
                
            except (ValidationError, ValueError) as ve:
                critique_feedback = (
                    f"CRITICAL ERROR on previous attempt: {str(ve)}. "
                    f"You violated the STRICT NEGATIVE CONSTRAINT. "
                    f"Immediately remove and rewrite all mentioned implementation names, languages, frameworks, and hardware into pure abstract mechanisms."
                )
            except Exception as e:
                break

        # Fallback dynamic heuristic distillation with cognitive purifier
        return self._heuristic_fallback(truncated_input)

    def _call_llm(self, text: str, critique: str) -> str:
        if not self.client:
            raise RuntimeError("No LLM client configured.")

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Document Text:\n\n{text}\n\n{critique if critique else ''}"}
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.1,
            max_tokens=1000
        )
        return response.choices[0].message.content

    def _parse_json(self, raw_str: str) -> Dict[str, Any]:
        cleaned = raw_str.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
            
        match = re.search(r'\{[\s\S]*\}', cleaned)
        if match:
            cleaned = match.group(0)
            
        return json.loads(cleaned)

    def _heuristic_fallback(self, text: str) -> ConceptualProjectIdea:
        """
        Dynamic rule-based cognitive extractor that analyzes actual user input text.
        """
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        first_line = lines[0] if lines else "Autonomous Scientific System"
        first_line = re.sub(r'^[#*\-\d.\s]+', '', first_line).strip()
        
        # Extract title from first line
        clean_title = heuristic_purifier(first_line[:90])
        if len(clean_title) < 5:
            clean_title = "Adaptive Mathematical Optimization Framework"

        # Dynamically search sections
        sections = {"problem": "", "vision": "", "impact": ""}
        current_section = "vision"
        
        for line in lines[1:]:
            lower = line.lower()
            if "problem" in lower or "friction" in lower or "bottleneck" in lower or "challenge" in lower:
                current_section = "problem"
                continue
            elif "vision" in lower or "mechanism" in lower or "method" in lower or "hypothesis" in lower or "approach" in lower:
                current_section = "vision"
                continue
            elif "impact" in lower or "outcome" in lower or "metric" in lower or "result" in lower:
                current_section = "impact"
                continue
            
            sections[current_section] += " " + line

        problem_text = sections["problem"].strip() or (
            "Complex real-world environments face operational divergence, measurement inaccuracies, and delayed fault detection across interacting components."
        )
        vision_text = sections["vision"].strip() or (
            "A closed-loop theoretical framework utilizing localized continuous parameter estimation and asynchronous equilibrium signaling to dynamically minimize systemic deviation."
        )
        impact_text = sections["impact"].strip() or (
            "Measurable 30% reduction in degradation variance and enhanced resilience across distributed operational regimes."
        )

        return ConceptualProjectIdea(
            title=clean_title,
            domain="Advanced Cyber-Physical Systems & Algorithmic Optimization",
            problem_statement=heuristic_purifier(problem_text[:350]),
            conceptual_vision=heuristic_purifier(vision_text[:400]),
            intended_impact=heuristic_purifier(impact_text[:250])
        )

distiller_agent = IdeaDistillerAgent()
