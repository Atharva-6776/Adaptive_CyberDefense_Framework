import logging
import sys
from logging.config import dictConfig

LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": LOG_FORMAT,
            "datefmt": "%Y-%m-%d %H:%M:%S"
        },
        "json": {
            "format": '{"timestamp": "%(asctime)s", "logger": "%(name)s", "level": "%(levelname)s", "message": "%(message)s"}'
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
            "stream": sys.stdout
        },
        "file": {
            "class": "logging.FileHandler",
            "formatter": "json",
            "filename": "app.log",
            "encoding": "utf-8"
        }
    },
    "loggers": {
        "app": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False
        },
        "security": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False
        },
        "mtd": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING"
    }
}


def setup_logging():
    dictConfig(logging_config)
    logging.getLogger("app").info("Logging system configured successfully.")
