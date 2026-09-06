from abc import ABC, abstractmethod
from typing import Dict, Any
from backend.models.schemas import AgentResponse

class BaseAgent(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def analyze(self, work: Dict[str, Any], context: Dict[str, Any]) -> AgentResponse:
        pass
