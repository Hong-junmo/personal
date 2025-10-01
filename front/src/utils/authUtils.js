// 정지 상태 확인 및 처리 유틸리티
export const handleSuspensionError = (error, navigate) => {
    if (error.message && (
        error.message.includes('정지된 계정') || 
        error.message.includes('계정이 정지') ||
        error.message.includes('영구 정지')
    )) {
        // 정지된 사용자는 자동 로그아웃
        localStorage.removeItem('token');
        localStorage.removeItem('nickname');
        alert('계정이 정지되어 로그아웃됩니다.\n\n' + error.message);
        navigate('/login');
        return true;
    }
    return false;
};

// API 응답에서 정지 상태 확인
export const checkSuspensionInResponse = async (response, navigate) => {
    if (!response.ok) {
        const errorData = await response.json();
        if (errorData.message && (
            errorData.message.includes('정지된 계정') || 
            errorData.message.includes('계정이 정지') ||
            errorData.message.includes('영구 정지')
        )) {
            localStorage.removeItem('token');
            localStorage.removeItem('nickname');
            alert('계정이 정지되어 로그아웃됩니다.\n\n' + errorData.message);
            navigate('/login');
            return true;
        }
    }
    return false;
};