

export const ConnectDB = async (prisma: any) => {
    try {
        // Actually test the connection with a simple query
        // $connect() doesn't work reliably with driver adapters
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ PostgreSQL connected successfully.');
    } catch (err) {
        console.error('❌ PostgreSQL connection failed:', err);
        // Re-throw to let the application handle startup failure
        throw err;
    }
};