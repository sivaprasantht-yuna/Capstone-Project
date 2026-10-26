"""
Multi-Tenant Isolation Module (Model B)
========================================
Central tenant resolution and query scoping for institutional data isolation.

Feature Flag:
  MULTI_TENANT_ENABLED=true  → All queries filtered by tenant_id (Model B: SaaS)
  MULTI_TENANT_ENABLED=false → No tenant filtering applied (Model A: Dedicated Instance)

To switch to Model A (single-institution deployment):
  Set MULTI_TENANT_ENABLED=false in .env — that's it. No code removal needed.
"""

from typing import Optional
from sqlalchemy.orm import Session, Query
from config import settings


def resolve_tenant_from_email(email: str, db: Session) -> Optional[str]:
    """
    Resolves a tenant_id from the user's email domain.
    Looks up the `tenants` table for a matching email_domains entry.
    Returns DEFAULT_TENANT_ID if no match found or multi-tenancy is disabled.
    """
    if not settings.MULTI_TENANT_ENABLED:
        return settings.DEFAULT_TENANT_ID

    from models import Tenant
    domain = email.split("@")[-1].lower().strip()

    # Check all active tenants for a matching email domain
    tenants = db.query(Tenant).filter(Tenant.is_active == True).all()
    for tenant in tenants:
        allowed_domains = [d.strip().lower() for d in tenant.email_domains.split(",")]
        if domain in allowed_domains:
            return tenant.id

    # Fallback to default tenant for unrecognized domains (demo/testing)
    return settings.DEFAULT_TENANT_ID


def get_tenant_name(tenant_id: str, db: Session) -> str:
    """Returns the human-readable institution name for a tenant_id."""
    from models import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    return tenant.name if tenant else "Unknown Institution"


def tenant_filter(query: Query, model, tenant_id: str) -> Query:
    """
    Applies tenant_id scoping to a SQLAlchemy query.
    If MULTI_TENANT_ENABLED is False, returns the query unchanged (Model A passthrough).

    Usage:
        query = tenant_filter(db.query(Project), Project, current_user.tenant_id)
    """
    if not settings.MULTI_TENANT_ENABLED:
        return query

    if hasattr(model, "tenant_id"):
        return query.filter(model.tenant_id == tenant_id)

    return query


def get_user_tenant_id(user) -> str:
    """
    Returns the tenant_id for the current user.
    Falls back to DEFAULT_TENANT_ID if multi-tenancy is disabled.
    """
    if not settings.MULTI_TENANT_ENABLED:
        return settings.DEFAULT_TENANT_ID
    return getattr(user, "tenant_id", settings.DEFAULT_TENANT_ID)
