"""
Configuration Manager for AI Service
Dynamically loads and manages all AI-related configurations
"""
import json
import os
from typing import Dict, Any, List
from pathlib import Path

class ConfigManager:
    """Manages all AI service configurations dynamically."""
    
    def __init__(self):
        self.config_dir = Path(__file__).parent / "config"
        self._skills_config = None
        self._patterns_config = None
        self._ai_config = None
        
    def load_skills_database(self) -> Dict[str, Any]:
        """Load skills database configuration."""
        if self._skills_config is None:
            config_path = self.config_dir / "skills_config.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    self._skills_config = json.load(f)
            else:
                # Fallback minimal config
                self._skills_config = {
                    "skills_database": {
                        "programming_languages": {
                            "python": ["python", "py", "django", "flask"],
                            "javascript": ["javascript", "js", "node.js", "react"]
                        }
                    }
                }
        return self._skills_config.get("skills_database", {})
    
    def load_extraction_patterns(self) -> Dict[str, Any]:
        """Load extraction patterns configuration."""
        if self._patterns_config is None:
            config_path = self.config_dir / "extraction_patterns.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    self._patterns_config = json.load(f)
            else:
                # Fallback minimal config
                self._patterns_config = {
                    "name_patterns": {
                        "common_prefixes": ["mr", "ms", "dr"],
                        "common_first_names": ["john", "jane", "alex"],
                        "common_last_names": ["smith", "doe", "johnson"],
                        "non_name_patterns": ["admin", "test", "user"],
                        "education_keywords": ["school", "college", "university"]
                    },
                    "location_patterns": {
                        "major_cities": {
                            "india": ["mumbai", "delhi", "bangalore"],
                            "usa": ["new york", "los angeles", "chicago"]
                        }
                    }
                }
        return self._patterns_config
    
    def load_ai_prompts(self) -> Dict[str, Any]:
        """Load AI prompts configuration."""
        if self._ai_config is None:
            config_path = self.config_dir / "ai_config.json"
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    self._ai_config = json.load(f)
            else:
                # Fallback minimal config
                self._ai_config = {
                    "ai_prompts": {
                        "development_plan": {
                            "system_prompt": "Create a development plan for the employee.",
                            "fallback_plan": {"growthAreas": []}
                        }
                    }
                }
        return self._ai_config.get("ai_prompts", {})
    
    def get_skill_variations(self, skill_category: str = None) -> Dict[str, List[str]]:
        """Get all skill variations, optionally filtered by category."""
        skills_db = self.load_skills_database()
        
        if skill_category:
            return skills_db.get(skill_category, {})
        
        # Flatten all categories
        all_skills = {}
        for category_data in skills_db.values():
            if isinstance(category_data, dict):
                all_skills.update(category_data)
        
        return all_skills
    
    def get_name_patterns(self) -> Dict[str, List[str]]:
        """Get name extraction patterns."""
        patterns = self.load_extraction_patterns()
        return patterns.get("name_patterns", {})
    
    def get_location_patterns(self) -> Dict[str, Any]:
        """Get location extraction patterns."""
        patterns = self.load_extraction_patterns()
        return patterns.get("location_patterns", {})
    
    def get_ai_prompt(self, prompt_type: str) -> Dict[str, Any]:
        """Get AI prompt configuration by type."""
        prompts = self.load_ai_prompts()
        return prompts.get(prompt_type, {})
    
    def reload_configs(self):
        """Reload all configurations from files."""
        self._skills_config = None
        self._patterns_config = None
        self._ai_config = None

# Global configuration manager instance
config_manager = ConfigManager()