export const COGNITO = {
  REGION:
    process.env.NEXT_PUBLIC_COGNITO_REGION ||
    process.env.NEXT_PUBLIC_USER_POOL_REGION,

  DOMAIN:
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
    process.env.NEXT_PUBLIC_USER_POOL_DOMAIN,

  USER_POOL_ID:
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ||
    process.env.NEXT_PUBLIC_USER_POOL_ID,

  CLIENT_ID:
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
    process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
};


export const AWS = {
  REGION: process.env.AWS_REGION
};


export const S3 = {
  BUCKET: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET
};


export const CLOUDFRONT = {
  URL:
    process.env.CLOUDFRONT_URL ||
    process.env.NEXT_PUBLIC_CLOUDFRONT_URL
};