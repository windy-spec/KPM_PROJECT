require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwtUtils = require('./utils/jwt.utils');
const axios = require('axios');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.users.findUnique({ where: { id: '90c9cd65-0c50-4f99-8e98-0adf5f63b93c' } });
    if (!user) { console.log('User not found'); return; }

    const token = jwtUtils.generateAccessToken(user);
    
    const res = await axios.get('http://localhost:5000/api/ai/sessions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log("API response status:", res.status);
    console.log("API response data:", res.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
