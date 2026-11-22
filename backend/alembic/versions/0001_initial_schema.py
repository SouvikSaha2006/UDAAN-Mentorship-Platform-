"""Initial Relational Schema for UDAAN Mentorship Platform

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-22 17:50:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Departments table (with hod & accessibility_compliance)
    op.create_table(
        'departments',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('hod', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('accessibility_compliance', sa.Integer(), nullable=False, server_default=sa.text('95')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_departments_code'), 'departments', ['code'], unique=True)

    # 3. Courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('department_id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('total_semesters', sa.Integer(), nullable=False, server_default=sa.text('8')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_courses_code'), 'courses', ['code'], unique=True)

    # 4. Student ID Sequences table (Feature 6 concurrency-safe atomic sequence)
    op.create_table(
        'student_id_sequences',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('dept_code', sa.String(length=50), nullable=False),
        sa.Column('last_seq', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('year', 'dept_code', name='uq_student_id_year_dept'),
    )

    # 5. Student Profiles table
    op.create_table(
        'student_profiles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('student_id', sa.String(length=50), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('date_of_birth', sa.String(length=50), nullable=True),
        sa.Column('gender', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('guardian_name', sa.String(length=255), nullable=True),
        sa.Column('guardian_phone', sa.String(length=50), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('avatar_color', sa.String(length=100), nullable=True),
        sa.Column('department_id', sa.String(length=36), nullable=True),
        sa.Column('course_id', sa.String(length=36), nullable=True),
        sa.Column('semester', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('batch_year', sa.Integer(), nullable=False, server_default=sa.text('2026')),
        sa.Column('roll_number', sa.String(length=50), nullable=True),
        sa.Column('cgpa', sa.Float(), nullable=False, server_default=sa.text('0.0')),
        sa.Column('profile_completion', sa.Integer(), nullable=False, server_default=sa.text('70')),
        sa.Column('career_goal', sa.String(length=255), nullable=True),
        sa.Column('disability_type', sa.String(length=100), nullable=True),
        sa.Column('disability_percentage', sa.Float(), nullable=True),
        sa.Column('assistive_devices', sa.JSON(), nullable=False),
        sa.Column('preferred_communication', sa.String(length=100), nullable=True),
        sa.Column('accommodation_needs', sa.Text(), nullable=True),
        sa.Column('udid_number', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_student_profiles_student_id'), 'student_profiles', ['student_id'], unique=True)
    op.create_index(op.f('ix_student_profiles_user_id'), 'student_profiles', ['user_id'], unique=True)

    # 6. User Accessibility Settings table
    op.create_table(
        'user_accessibility_settings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('font_scale', sa.Float(), nullable=False, server_default=sa.text('1.0')),
        sa.Column('dark_mode', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('high_contrast', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('highlight_links', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('dyslexia_font', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('reading_mode', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('line_spacing', sa.Float(), nullable=False, server_default=sa.text('1.6')),
        sa.Column('large_controls', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('reduced_motion', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('focus_enhanced', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('written_notifications', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('caption_mode', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('tts_rate', sa.Float(), nullable=False, server_default=sa.text('1.0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_accessibility_settings_user_id'), 'user_accessibility_settings', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_table('user_accessibility_settings')
    op.drop_table('student_profiles')
    op.drop_table('student_id_sequences')
    op.drop_table('courses')
    op.drop_table('departments')
    op.drop_table('users')
