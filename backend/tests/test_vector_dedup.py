import pytest
import io
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.schemas import ConceptualProjectIdea, FORBIDDEN_IMPLEMENTATION_TERMS
from app.agents.distiller import distiller_agent, heuristic_purifier
from app.services.parser import extract_text_in_memory

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "FastEmbed" in data["embedding_engine"]
    assert data["storage_mode"] == "ZERO_STORAGE_RAM_ONLY"

def test_hardware_sanitizer_and_blacklist_scrubbing():
    """
    Test that an input text laden with ESP32, MQTT, React, and Python has all implementation
    details completely sanitized and passes the Pydantic negative constraints.
    """
    sample_dirty_text = (
        "Project Proposal: ESP32 Smart Agricultural Telemetry Node\n\n"
        "We build an IoT agricultural node using an ESP32 microcontroller and DHT22 sensors. "
        "The data is transmitted over MQTT via Wi-Fi to a FastAPI backend with PostgreSQL on AWS. "
        "A React dashboard visualizes moisture levels and a YOLOv8 CNN model detects crop pests in Python."
    )
    
    # 1. Test In-memory parser
    extracted = extract_text_in_memory(sample_dirty_text.encode("utf-8"), "proposal.txt")
    assert "ESP32" in extracted
    
    # 2. Test Distiller
    concept = distiller_agent.distill(extracted)
    
    # 3. Assert no forbidden terms in any of the conceptual fields
    for field_name in ["title", "domain", "problem_statement", "conceptual_vision", "intended_impact"]:
        val = getattr(concept, field_name).lower()
        for term in ["esp32", "mqtt", "react", "fastapi", "aws", "cnn", "yolov8", "python"]:
            assert f" {term} " not in f" {val} ", f"Forbidden term '{term}' leaked into '{field_name}': {val}"
    
    print("\n[Passed] Sanitized Conceptual Idea:")
    print("Title:", concept.title)
    print("Vision:", concept.conceptual_vision)

def test_vector_deduplication_gate_end_to_end():
    """
    Test that uploading the same abstract text twice commits the first time (stored=True)
    and gets blocked/gated the second time (stored=False, similarity >= 0.85).
    """
    test_doc = (
        "Decentralized Soil Salinity Equilibrium Sensor Mesh\n\n"
        "Problem: Arid region agriculture experiences uncontrolled root-zone hyper-salinization, "
        "causing 40% irreversible crop root desiccation.\n\n"
        "Theoretical Mechanism: Continuous in-situ ionic conductivity equilibrium monitoring across an "
        "asynchronous peer-to-peer telemetry mesh, deploying localized algorithmic threshold triggers "
        "to modulate sub-surface pulse irrigation dynamically.\n\n"
        "Measurable Outcome: 35% reduction in groundwater degradation and a 28% increase in perennial yield resilience."
    )
    
    # 1. First Scan (Should be stored as new unique concept or already exist)
    res1 = client.post("/api/scan-document", data={"text": test_doc})
    assert res1.status_code == 200
    json1 = res1.json()
    assert "data" in json1
    assert "status" in json1
    
    # 2. Second Scan (Identical text MUST trigger deduplication gate: stored=False, similarity >= 0.85)
    res2 = client.post("/api/scan-document", data={"text": test_doc})
    assert res2.status_code == 200
    json2 = res2.json()
    assert json2["stored"] is False
    assert json2["status"] == "DUPLICATE_GATED"
    assert json2["similarity"] >= 0.85
    assert json2["existing_match"] is not None
    print(f"\n[Passed] Duplicate successfully caught with similarity: {json2['similarity']:.4f}")
