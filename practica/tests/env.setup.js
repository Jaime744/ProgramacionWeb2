// Variables de entorno para los tests (se cargan antes de cualquier import)
process.env.NODE_ENV               = 'test'
process.env.JWT_SECRET             = 'test_jwt_secret_for_integration_tests'
process.env.JWT_REFRESH_SECRET     = 'test_jwt_refresh_secret_for_integration_tests'
process.env.JWT_EXPIRES_IN         = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

// R2 (mockeado en los tests, pero las funciones helpers leen estas vars)
process.env.R2_ACCOUNT_ID        = 'test_account_id'
process.env.R2_ACCESS_KEY_ID     = 'test_access_key'
process.env.R2_SECRET_ACCESS_KEY = 'test_secret_key'
process.env.R2_BUCKET            = 'test_bucket'
process.env.R2_PUBLIC_URL        = 'https://test.r2.dev'
