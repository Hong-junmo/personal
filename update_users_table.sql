-- 사용자 테이블에 역할 및 정지 관련 컬럼 추가
ALTER TABLE users 
ADD COLUMN role VARCHAR(10) DEFAULT 'USER' NOT NULL,
ADD COLUMN is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN suspension_end_time TIMESTAMP NULL,
ADD COLUMN suspension_reason TEXT NULL;

-- 기존 사용자들의 역할을 USER로 설정
UPDATE users SET role = 'USER' WHERE role IS NULL;

-- 첫 번째 사용자를 운영자로 설정 (필요시)
-- UPDATE users SET role = 'OPERATOR' WHERE id = 1;

-- 두 번째 사용자를 관리자로 설정 (필요시)
-- UPDATE users SET role = 'ADMIN' WHERE id = 2;