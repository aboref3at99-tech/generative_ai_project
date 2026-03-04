import os
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


class SupabaseConnection:
    _instance: Optional['SupabaseConnection'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.url = os.getenv("VITE_SUPABASE_URL")
        self.key = os.getenv("VITE_SUPABASE_SUPABASE_ANON_KEY")

        if not self.url or not self.key:
            logger.warning("Supabase credentials not found in environment")
            self.client = None
        else:
            try:
                from supabase import create_client
                self.client = create_client(self.url, self.key)
                logger.info("Supabase client initialized")
            except ImportError:
                logger.warning("Supabase SDK not installed. Install with: pip install supabase")
                self.client = None

        self._initialized = True

    def is_connected(self) -> bool:
        return self.client is not None


class ConversationHistory:
    def __init__(self, supabase: SupabaseConnection):
        self.db = supabase.client
        self.table_name = "conversation_history"

    def save_conversation(
        self,
        user_id: str,
        messages: List[Dict[str, str]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        if not self.db:
            logger.error("Database not connected")
            return False

        try:
            data = {
                "user_id": user_id,
                "messages": messages,
                "metadata": metadata or {},
            }

            response = self.db.table(self.table_name).insert(data).execute()
            logger.info(f"Conversation saved for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error saving conversation: {str(e)}")
            return False

    def get_conversation_history(self, user_id: str) -> Optional[List[Dict]]:
        if not self.db:
            logger.error("Database not connected")
            return None

        try:
            response = self.db.table(self.table_name).select("*").eq(
                "user_id", user_id
            ).order("created_at", desc=True).limit(10).execute()

            return response.data
        except Exception as e:
            logger.error(f"Error retrieving conversation history: {str(e)}")
            return None

    def delete_conversation(self, conversation_id: str) -> bool:
        if not self.db:
            logger.error("Database not connected")
            return False

        try:
            self.db.table(self.table_name).delete().eq("id", conversation_id).execute()
            logger.info(f"Conversation {conversation_id} deleted")
            return True
        except Exception as e:
            logger.error(f"Error deleting conversation: {str(e)}")
            return False


class APIUsageTracker:
    def __init__(self, supabase: SupabaseConnection):
        self.db = supabase.client
        self.table_name = "api_usage"

    def log_usage(
        self,
        user_id: str,
        model: str,
        tokens_used: int,
        cost: float
    ) -> bool:
        if not self.db:
            logger.error("Database not connected")
            return False

        try:
            data = {
                "user_id": user_id,
                "model": model,
                "tokens_used": tokens_used,
                "cost": cost,
            }

            self.db.table(self.table_name).insert(data).execute()
            logger.info(f"Usage logged for user {user_id} on model {model}")
            return True
        except Exception as e:
            logger.error(f"Error logging usage: {str(e)}")
            return False

    def get_usage_stats(self, user_id: str) -> Optional[Dict[str, Any]]:
        if not self.db:
            logger.error("Database not connected")
            return None

        try:
            response = self.db.table(self.table_name).select("*").eq(
                "user_id", user_id
            ).execute()

            data = response.data
            if not data:
                return None

            total_tokens = sum(item["tokens_used"] for item in data)
            total_cost = sum(item["cost"] for item in data)

            return {
                "user_id": user_id,
                "total_requests": len(data),
                "total_tokens": total_tokens,
                "total_cost": total_cost,
                "requests": data
            }
        except Exception as e:
            logger.error(f"Error retrieving usage stats: {str(e)}")
            return None
