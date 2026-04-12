## School Management System

### RUN backend in system

1. cd backend (Go to backend directory)
2. npm install (Install dependencies)
3. docker run -d --name redis -p 6379:6379 redis:7-alpine (Run redis)
4. npm start (Run backend)

<!-- prsima  -->
npx prisma format
npx prisma migrate dev --name update-payment-schema
npx prisma generate
