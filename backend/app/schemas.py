from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re

# Comprehensive list of forbidden implementation terms, hardware names, protocols, and frameworks
FORBIDDEN_IMPLEMENTATION_TERMS = [
    # Hardware & Microcontrollers
    "esp32", "esp8266", "arduino", "raspberry pi", "stm32", "microcontroller",
    "pinout", "gpio", "uart", "i2c", "spi", "pcb", "circuit", "breadboard",
    "sensor module", "relay", "actuator", "soldering",
    # Protocols & Networking
    "mqtt", "bluetooth", "ble", "zigbee", "lora", "lorawan", "wifi",
    "http", "https", "websocket", "rest api", "json", "xml", "soap",
    # Programming Languages & Frameworks
    "python", "javascript", "typescript", "react", "react.js", "vue", "angular",
    "fastapi", "flask", "django", "spring boot", "java", "c++", "c#", "golang",
    "rust", "node.js", "express", "tailwind", "bootstrap",
    # Databases & Storage
    "sql", "mysql", "postgresql", "postgres", "mongodb", "sqlite", "redis",
    "dynamodb", "supabase", "firebase",
    # Cloud & DevOps
    "aws", "gcp", "azure", "docker", "kubernetes", "s3 bucket", "ec2",
    "lambda", "serverless", "vercel", "heroku", "ci/cd", "github actions",
    # Specific AI Architectures & Models (Must express conceptually, e.g. 'hierarchical feature extraction' instead of 'ResNet50')
    "cnn", "rnn", "lstm", "transformer", "bert", "gpt", "llama", "resnet",
    "yolo", "pytorch", "tensorflow", "keras", "scikit-learn"
]

def sanitize_and_check_text(field_name: str, value: str) -> str:
    if not value or not isinstance(value, str):
        return value
    
    val_lower = value.lower()
    matched_terms = []
    
    for term in FORBIDDEN_IMPLEMENTATION_TERMS:
        # Match whole words or boundary patterns
        pattern = r'\b' + re.escape(term) + r'\b'
        if re.search(pattern, val_lower):
            matched_terms.append(term)
            
    if matched_terms:
        raise ValueError(
            f"Implementation detail leakage detected in '{field_name}'. "
            f"Forbidden terms found: {matched_terms}. "
            f"The field must contain ONLY pure conceptual abstractions, theoretical mechanisms, or principles, "
            f"strictly without programming languages, hardware/microcontroller names, protocols, or procedural implementation steps."
        )
    return value.strip()


class ConceptualProjectIdea(BaseModel):
    """
    Abstract Conceptual Idea Model completely stripped of implementation details,
    architectures, frameworks, hardware, or procedural execution steps.
    """
    title: str = Field(
        ...,
        description="Abstract conceptual title capturing the core invention or research thesis."
    )
    domain: str = Field(
        ...,
        description="High-level scientific, engineering, or societal domain."
    )
    problem_statement: str = Field(
        ...,
        description="The fundamental friction, structural bottleneck, or challenge addressed."
    )
    conceptual_vision: str = Field(
        ...,
        description="The theoretical hypothesis, conceptual mechanism, or systemic approach (ZERO how-to or tech stack)."
    )
    intended_impact: str = Field(
        ...,
        description="Measurable human, economic, ecological, or systemic outcome."
    )

    @field_validator('title', mode='after')
    @classmethod
    def validate_title(cls, v: str) -> str:
        return sanitize_and_check_text("title", v)

    @field_validator('domain', mode='after')
    @classmethod
    def validate_domain(cls, v: str) -> str:
        return sanitize_and_check_text("domain", v)

    @field_validator('problem_statement', mode='after')
    @classmethod
    def validate_problem_statement(cls, v: str) -> str:
        return sanitize_and_check_text("problem_statement", v)

    @field_validator('conceptual_vision', mode='after')
    @classmethod
    def validate_conceptual_vision(cls, v: str) -> str:
        return sanitize_and_check_text("conceptual_vision", v)

    @field_validator('intended_impact', mode='after')
    @classmethod
    def validate_intended_impact(cls, v: str) -> str:
        return sanitize_and_check_text("intended_impact", v)


class IdeaMatch(BaseModel):
    id: int
    title: str
    domain: str
    problem_statement: str
    conceptual_vision: str
    intended_impact: str
    similarity: float
    created_at: Optional[str] = None


class ScanDocumentResponse(BaseModel):
    status: str
    stored: bool
    message: str
    similarity: float
    existing_match: Optional[IdeaMatch] = None
    data: ConceptualProjectIdea
