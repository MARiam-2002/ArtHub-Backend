import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAILWAY_URL = 'https://arthub-backend.up.railway.app';

async function testRailwayEndpoints() {
  console.log('🔍 تشخيص مشكلة Railway...\n');

  const endpoints = [
    { path: '/', name: 'Root endpoint' },
    { path: '/health', name: 'Health check' },
    { path: '/api', name: 'API base' },
    { path: '/api/health', name: 'API health check' },
    { path: '/api-docs', name: 'Swagger UI' },
    { path: '/api-docs/swagger.json', name: 'Swagger JSON' },
    { path: '/api-docs/swagger.yaml', name: 'Swagger YAML' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 اختبار: ${endpoint.name}`);
      console.log(`   URL: ${RAILWAY_URL}${endpoint.path}`);
      
      const startTime = Date.now();
      const response = await axios.get(`${RAILWAY_URL}${endpoint.path}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Railway-Debug-Script/1.0'
        }
      });
      const endTime = Date.now();
      
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ⏱️  Response Time: ${endTime - startTime}ms`);
      console.log(`   📏 Content Length: ${response.data ? JSON.stringify(response.data).length : 0} chars`);
      
      if (response.data && typeof response.data === 'object') {
        console.log(`   📄 Response Type: ${response.headers['content-type'] || 'unknown'}`);
        if (response.data.success !== undefined) {
          console.log(`   ✅ Success: ${response.data.success}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📄 Headers: ${JSON.stringify(error.response.headers)}`);
      }
    }
    console.log('');
  }
}

async function checkLocalFiles() {
  console.log('📁 فحص الملفات المحلية...\n');

  const requiredFiles = [
    'index.js',
    'package.json',
    'railway.json',
    'nixpacks.toml',
    'src/index.router.js',
    'src/swagger/swagger.js',
    'src/swagger/arthub-swagger.json'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? 'موجود' : 'غير موجود'}`);
  }
  console.log('');
}

async function checkPackageJson() {
  console.log('📦 فحص package.json...\n');
  
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    console.log(`📋 Name: ${packageJson.name}`);
    console.log(`📋 Version: ${packageJson.version}`);
    console.log(`📋 Main: ${packageJson.main}`);
    console.log(`📋 Type: ${packageJson.type}`);
    console.log(`📋 Start Script: ${packageJson.scripts.start}`);
    console.log(`📋 Node Version: ${packageJson.engines?.node || 'not specified'}`);
    console.log('');
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
  }
}

async function checkSwaggerFiles() {
  console.log('📚 فحص ملفات Swagger...\n');
  
  const swaggerFiles = [
    'src/swagger/arthub-swagger.json',
    'src/swagger/swagger.json',
    'src/swagger/swagger.yaml'
  ];

  for (const file of swaggerFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`❌ ${file} - غير موجود`);
    }
  }
  console.log('');
}

async function main() {
  console.log('🚀 بدء تشخيص مشكلة Railway\n');
  console.log('=' .repeat(50));
  
  await checkLocalFiles();
  await checkPackageJson();
  await checkSwaggerFiles();
  await testRailwayEndpoints();
  
  console.log('=' .repeat(50));
  console.log('✅ انتهى التشخيص');
}

main().catch(console.error); 