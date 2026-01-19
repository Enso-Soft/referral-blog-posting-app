/**
 * 커스텀 에러 클래스들
 * 일관된 에러 처리를 위한 에러 타입 정의
 */

// 기본 앱 에러
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'APP_ERROR',
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// API 에러 (HTTP 응답 에러)
export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    public details?: string
  ) {
    super(message, 'API_ERROR', statusCode)
    this.name = 'ApiError'
  }

  static unauthorized(message = '인증이 필요합니다') {
    return new ApiError(message, 401)
  }

  static forbidden(message = '접근 권한이 없습니다') {
    return new ApiError(message, 403)
  }

  static notFound(message = '리소스를 찾을 수 없습니다') {
    return new ApiError(message, 404)
  }

  static badRequest(message = '잘못된 요청입니다', details?: string) {
    return new ApiError(message, 400, details)
  }

  static internal(message = '서버 오류가 발생했습니다') {
    return new ApiError(message, 500)
  }
}

// 유효성 검증 에러
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field?: string,
    public errors: string[] = []
  ) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

// 인증 에러
export class AuthError extends AppError {
  constructor(message = '인증에 실패했습니다') {
    super(message, 'AUTH_ERROR', 401)
    this.name = 'AuthError'
  }
}

// 네트워크 에러
export class NetworkError extends AppError {
  constructor(message = '네트워크 연결을 확인해주세요') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    // 일반적인 에러 메시지 매핑
    if (error.message.includes('Failed to fetch')) {
      return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'
    }
    if (error.message.includes('timeout')) {
      return '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.'
    }
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * HTTP 상태 코드에 따른 기본 메시지
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return '잘못된 요청입니다.'
    case 401:
      return '로그인이 필요합니다.'
    case 403:
      return '접근 권한이 없습니다.'
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.'
    case 409:
      return '리소스 충돌이 발생했습니다.'
    case 422:
      return '요청을 처리할 수 없습니다.'
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    case 500:
      return '서버 오류가 발생했습니다.'
    case 502:
      return '서버 게이트웨이 오류가 발생했습니다.'
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.'
    default:
      return '오류가 발생했습니다.'
  }
}

/**
 * API 응답에서 에러 추출
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const data = await response.json()
    const message = data.error || data.message || getHttpErrorMessage(response.status)
    const details = data.details
    return new ApiError(message, response.status, details)
  } catch {
    return new ApiError(getHttpErrorMessage(response.status), response.status)
  }
}
