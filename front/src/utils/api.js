// API 유틸리티 - 정지된 사용자 자동 로그아웃 처리
const API_BASE_URL = 'http://localhost:8080';

// 자동 로그아웃 처리 함수
const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
    
    // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
    if (window.location.pathname !== '/login') {
        alert('계정이 정지되어 로그아웃되었습니다.');
        window.location.href = '/login';
    }
};

// 공통 fetch 함수
export const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
        
        // 401 Unauthorized 응답 처리
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            
            // 정지 관련 에러인 경우 자동 로그아웃
            if (errorData.error && (
                errorData.error.includes('정지') || 
                errorData.error.includes('SUSPENDED') ||
                errorData.error.includes('영구 정지')
            )) {
                handleUnauthorized();
                throw new Error(errorData.error || '계정이 정지되었습니다.');
            }
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};

// GET 요청
export const apiGet = (url, options = {}) => {
    return apiRequest(url, { method: 'GET', ...options });
};

// POST 요청
export const apiPost = (url, data = {}, options = {}) => {
    return apiRequest(url, {
        method: options.method || 'POST',
        body: JSON.stringify(data),
        ...options
    });
};

// PUT 요청
export const apiPut = (url, data, options = {}) => {
    return apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    });
};

// DELETE 요청
export const apiDelete = (url, options = {}) => {
    return apiRequest(url, { method: 'DELETE', ...options });
};

// FormData 전용 POST 요청 (파일 업로드용)
export const apiPostFormData = async (url, formData, options = {}) => {
    const token = localStorage.getItem('token');
    
    const finalOptions = {
        method: options.method || 'POST',
        body: formData,
        headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
            // Content-Type은 FormData 사용 시 브라우저가 자동으로 설정하므로 제외
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
        
        // 401 Unauthorized 응답 처리
        if (response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            
            // 정지 관련 에러인 경우 자동 로그아웃
            if (errorData.error && (
                errorData.error.includes('정지') || 
                errorData.error.includes('SUSPENDED') ||
                errorData.error.includes('영구 정지')
            )) {
                handleUnauthorized();
                throw new Error(errorData.error || '계정이 정지되었습니다.');
            }
        }
        
        return response;
    } catch (error) {
        throw error;
    }
};