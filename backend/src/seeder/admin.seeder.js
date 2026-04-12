require("dotenv").config();

const prisma = require("../config/db.config");
const { Role, Status } = require("../config/constant.config");
const bcrypt = require("bcryptjs");

if (process.env.NODE_ENV === "production") {
    console.error("❌ Seeder cannot run in production. Exiting.");
    process.exit(1);
}

const seedUser = async () => {
    try {
        const email = process.env.SEED_ADMIN_EMAIL;
        const plainPassword = process.env.SEED_ADMIN_PASSWORD;

        if (!email || !plainPassword) {
            console.error(
                "❌ Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in .env file"
            );
            process.exit(1);
        }

        const password = await bcrypt.hash(plainPassword, 12);

        const adminUser = {
            name: process.env.SEED_ADMIN_NAME || "Super Admin",
            email,
            password,
            role: Role.SUPER_ADMIN,
            status: Status.ACTIVE,
            address: {
                country: process.env.SEED_ADMIN_COUNTRY || "Nepal",
                province: process.env.SEED_ADMIN_PROVINCE || "Province 1",
                district: process.env.SEED_ADMIN_DISTRICT || "Morang",
                fullAddress: process.env.SEED_ADMIN_ADDRESS || "Biratnagar",
            },
        };

        console.log("\n🌱 Seeding admin user...\n");

        const existing = await prisma.user.findUnique({
            where: { email: adminUser.email },
        });

        if (!existing) {
            const created = await prisma.user.create({ data: adminUser });
            console.log("✅ Admin user created successfully!\n");
            console.log("📋 User Details:");
            console.log(`   Email: ${created.email}`);
            console.log(`   Name: ${created.name}`);
            console.log(`   Role: ${created.role}`);
            console.log(`   Status: ${created.status}\n`);
        } else {
            console.log("ℹ️  Admin user already exists. Skipping.\n");
            console.log(`   Email: ${existing.email}`);
            console.log(`   Name: ${existing.name}\n`);
        }

        console.log("✅ Seeding completed.\n");
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

seedUser().then(() => process.exit(0));