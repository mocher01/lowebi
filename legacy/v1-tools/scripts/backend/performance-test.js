/**
 * Performance test for AI Queue Entities
 * Tests entity creation, JSONB handling, and computed property performance
 */

const { performance } = require('perf_hooks');

// Import compiled entities
const { Customer, CustomerStatus, CustomerTier } = require('./dist/customer/entities/customer.entity');
const { AiRequest, RequestType, RequestStatus, RequestPriority } = require('./dist/admin/entities/ai-request.entity');
const { AdminActivityLog, AdminAction, TargetType } = require('./dist/admin/entities/admin-activity-log.entity');
const { AiRequestHistory, ChangeType } = require('./dist/admin/entities/ai-request-history.entity');

function measureTime(label, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

async function performanceTest() {
  console.log('🚀 Starting AI Queue Entities Performance Testing...\n');

  const results = {
    entityCreation: {},
    jsonbHandling: {},
    computedProperties: {},
    bulkOperations: {}
  };

  // Test 1: Entity Creation Performance
  console.log('📊 Testing Entity Creation Performance...');
  
  // Customer creation
  const customerCreation = measureTime('Customer creation (1000 instances)', () => {
    const customers = [];
    for (let i = 0; i < 1000; i++) {
      customers.push(new Customer({
        userId: `user-${i}`,
        companyName: `Company ${i}`,
        businessType: 'Technology',
        status: CustomerStatus.ACTIVE,
        tier: CustomerTier.FREE
      }));
    }
    return customers;
  });
  results.entityCreation.customer = customerCreation.duration;

  // AiRequest creation
  const aiRequestCreation = measureTime('AiRequest creation (1000 instances)', () => {
    const requests = [];
    for (let i = 0; i < 1000; i++) {
      requests.push(new AiRequest({
        customerId: `customer-${i}`,
        siteId: `site-${i}`,
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {
          companyName: `Company ${i}`,
          industry: 'Technology',
          targetAudience: 'Business professionals'
        }
      }));
    }
    return requests;
  });
  results.entityCreation.aiRequest = aiRequestCreation.duration;

  // AdminActivityLog creation
  const activityLogCreation = measureTime('AdminActivityLog creation (1000 instances)', () => {
    const logs = [];
    for (let i = 0; i < 1000; i++) {
      logs.push(new AdminActivityLog({
        adminId: `admin-${i}`,
        action: AdminAction.AI_REQUEST_ASSIGNED,
        targetType: TargetType.AI_REQUEST,
        targetId: `request-${i}`,
        details: { operation: `assignment-${i}` }
      }));
    }
    return logs;
  });
  results.entityCreation.activityLog = activityLogCreation.duration;

  // AiRequestHistory creation
  const historyCreation = measureTime('AiRequestHistory creation (1000 instances)', () => {
    const histories = [];
    for (let i = 0; i < 1000; i++) {
      histories.push(new AiRequestHistory({
        requestId: `request-${i}`,
        changeType: ChangeType.STATUS_CHANGE,
        changedBy: `admin-${i}`,
        details: { changeNumber: i }
      }));
    }
    return histories;
  });
  results.entityCreation.history = historyCreation.duration;

  console.log('');

  // Test 2: JSONB Handling Performance
  console.log('📊 Testing JSONB Field Performance...');

  // Customer preferences handling
  const customerPreferences = measureTime('Customer preferences (1000 large JSONB)', () => {
    const customers = [];
    for (let i = 0; i < 1000; i++) {
      const largePreferences = {
        aiContentPreferences: {
          tone: 'professional',
          style: 'business',
          terminology: Array.from({ length: 50 }, (_, j) => `term-${j}`)
        },
        notificationSettings: {
          email: true,
          sms: false,
          channels: Array.from({ length: 20 }, (_, j) => `channel-${j}`)
        },
        customSettings: {}
      };
      
      // Add 100 custom settings
      for (let j = 0; j < 100; j++) {
        largePreferences.customSettings[`setting_${j}`] = {
          value: `value_${j}`,
          type: 'string',
          metadata: { index: j }
        };
      }

      customers.push(new Customer({
        userId: `user-${i}`,
        preferences: largePreferences
      }));
    }
    return customers;
  });
  results.jsonbHandling.customerPreferences = customerPreferences.duration;

  // AiRequest requestData handling
  const requestDataHandling = measureTime('AiRequest requestData (1000 complex JSONB)', () => {
    const requests = [];
    for (let i = 0; i < 1000; i++) {
      const complexRequestData = {
        companyName: `Company ${i}`,
        industry: 'Technology',
        targetAudience: 'Business professionals',
        keyServices: Array.from({ length: 20 }, (_, j) => `Service ${j}`),
        brandValues: Array.from({ length: 10 }, (_, j) => `Value ${j}`),
        competitorUrls: Array.from({ length: 15 }, (_, j) => `https://competitor${j}.com`),
        wizard: {
          steps: Array.from({ length: 8 }, (_, step) => ({
            stepNumber: step + 1,
            data: Array.from({ length: 10 }, (_, field) => ({
              field: `field_${field}`,
              value: `value_${field}_${i}`
            }))
          }))
        }
      };

      requests.push(new AiRequest({
        customerId: `customer-${i}`,
        siteId: `site-${i}`,
        requestType: RequestType.CUSTOM,
        businessType: 'Technology',
        requestData: complexRequestData
      }));
    }
    return requests;
  });
  results.jsonbHandling.requestData = requestDataHandling.duration;

  console.log('');

  // Test 3: Computed Properties Performance
  console.log('📊 Testing Computed Properties Performance...');

  // Create test data for computed properties
  const testRequests = [];
  const now = new Date();
  for (let i = 0; i < 1000; i++) {
    const request = new AiRequest({
      customerId: `customer-${i}`,
      siteId: `site-${i}`,
      requestType: RequestType.CONTENT,
      businessType: 'Technology',
      requestData: {},
      createdAt: new Date(now.getTime() - (i * 60 * 60 * 1000)), // i hours ago
      startedAt: i % 2 === 0 ? new Date(now.getTime() - (i * 30 * 60 * 1000)) : null, // Some started
      completedAt: i % 3 === 0 ? new Date(now.getTime() - (i * 15 * 60 * 1000)) : null, // Some completed
      expiresAt: i % 4 === 0 ? new Date(now.getTime() - (i * 5 * 60 * 1000)) : null // Some expired
    });
    testRequests.push(request);
  }

  // Test isExpired performance
  const expiredCheck = measureTime('isExpired computation (1000 calls)', () => {
    let expiredCount = 0;
    for (const request of testRequests) {
      if (request.isExpired) expiredCount++;
    }
    return expiredCount;
  });
  results.computedProperties.isExpired = expiredCheck.duration;

  // Test totalDuration performance
  const durationCheck = measureTime('totalDuration computation (1000 calls)', () => {
    let totalDurations = 0;
    for (const request of testRequests) {
      const duration = request.totalDuration;
      if (duration !== null) totalDurations += duration;
    }
    return totalDurations;
  });
  results.computedProperties.totalDuration = durationCheck.duration;

  // Test isOverdue performance
  const overdueCheck = measureTime('isOverdue computation (1000 calls)', () => {
    let overdueCount = 0;
    for (const request of testRequests) {
      if (request.isOverdue) overdueCount++;
    }
    return overdueCount;
  });
  results.computedProperties.isOverdue = overdueCheck.duration;

  console.log('');

  // Test 4: Bulk Operations Performance
  console.log('📊 Testing Bulk Operations Performance...');

  // Bulk JSONB access
  const bulkJsonbAccess = measureTime('Bulk JSONB field access (10000 operations)', () => {
    const customers = customerPreferences.result.slice(0, 100); // Use first 100
    let accessCount = 0;
    
    for (let i = 0; i < 100; i++) {
      for (const customer of customers) {
        // Access nested JSONB data
        if (customer.preferences?.aiContentPreferences?.terminology) {
          accessCount += customer.preferences.aiContentPreferences.terminology.length;
        }
        if (customer.preferences?.customSettings) {
          accessCount += Object.keys(customer.preferences.customSettings).length;
        }
      }
    }
    return accessCount;
  });
  results.bulkOperations.jsonbAccess = bulkJsonbAccess.duration;

  // Bulk entity property access
  const bulkPropertyAccess = measureTime('Bulk entity property access (10000 operations)', () => {
    const requests = testRequests.slice(0, 100); // Use first 100
    let accessCount = 0;
    
    for (let i = 0; i < 100; i++) {
      for (const request of requests) {
        accessCount += request.id ? 1 : 0;
        accessCount += request.customerId ? 1 : 0;
        accessCount += request.status ? 1 : 0;
        accessCount += request.priority ? 1 : 0;
        accessCount += request.estimatedCost || 0;
      }
    }
    return accessCount;
  });
  results.bulkOperations.propertyAccess = bulkPropertyAccess.duration;

  console.log('');

  // Test 5: Memory Usage Test
  console.log('📊 Testing Memory Usage...');
  
  const initialMemory = process.memoryUsage();
  
  // Create a large number of entities
  const memoryTest = measureTime('Memory test (5000 complex entities)', () => {
    const entities = [];
    
    for (let i = 0; i < 5000; i++) {
      // Create complex customer
      const customer = new Customer({
        userId: `user-${i}`,
        companyName: `Company ${i}`,
        businessType: 'Technology',
        preferences: {
          aiContentPreferences: {
            terminology: Array.from({ length: 20 }, (_, j) => `term-${j}`)
          },
          customSettings: Object.fromEntries(
            Array.from({ length: 50 }, (_, j) => [`key${j}`, `value${j}`])
          )
        },
        metadata: {
          largeArray: Array.from({ length: 100 }, (_, j) => ({ id: j, data: `data-${j}` }))
        }
      });

      // Create AI request
      const request = new AiRequest({
        customerId: `customer-${i}`,
        siteId: `site-${i}`,
        requestType: RequestType.CONTENT,
        businessType: 'Technology',
        requestData: {
          companyName: `Company ${i}`,
          largeServicesList: Array.from({ length: 30 }, (_, j) => `Service ${j}`)
        }
      });

      entities.push({ customer, request });
    }
    
    return entities.length;
  });
  
  const finalMemory = process.memoryUsage();
  const memoryDiff = {
    heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
    external: finalMemory.external - initialMemory.external
  };

  console.log('');

  // Results Summary
  console.log('📊 PERFORMANCE TEST RESULTS SUMMARY');
  console.log('=====================================');
  
  console.log('\n🏗️  Entity Creation Performance:');
  console.log(`  Customer:        ${results.entityCreation.customer.toFixed(2)}ms (${(1000/results.entityCreation.customer).toFixed(0)} ops/sec)`);
  console.log(`  AiRequest:       ${results.entityCreation.aiRequest.toFixed(2)}ms (${(1000/results.entityCreation.aiRequest).toFixed(0)} ops/sec)`);
  console.log(`  ActivityLog:     ${results.entityCreation.activityLog.toFixed(2)}ms (${(1000/results.entityCreation.activityLog).toFixed(0)} ops/sec)`);
  console.log(`  RequestHistory:  ${results.entityCreation.history.toFixed(2)}ms (${(1000/results.entityCreation.history).toFixed(0)} ops/sec)`);

  console.log('\n📄 JSONB Handling Performance:');
  console.log(`  Customer Prefs:  ${results.jsonbHandling.customerPreferences.toFixed(2)}ms (${(1000/results.jsonbHandling.customerPreferences).toFixed(0)} ops/sec)`);
  console.log(`  Request Data:    ${results.jsonbHandling.requestData.toFixed(2)}ms (${(1000/results.jsonbHandling.requestData).toFixed(0)} ops/sec)`);

  console.log('\n⚡ Computed Properties Performance:');
  console.log(`  isExpired:       ${results.computedProperties.isExpired.toFixed(2)}ms (${(1000/results.computedProperties.isExpired).toFixed(0)} ops/sec)`);
  console.log(`  totalDuration:   ${results.computedProperties.totalDuration.toFixed(2)}ms (${(1000/results.computedProperties.totalDuration).toFixed(0)} ops/sec)`);
  console.log(`  isOverdue:       ${results.computedProperties.isOverdue.toFixed(2)}ms (${(1000/results.computedProperties.isOverdue).toFixed(0)} ops/sec)`);

  console.log('\n🚀 Bulk Operations Performance:');
  console.log(`  JSONB Access:    ${results.bulkOperations.jsonbAccess.toFixed(2)}ms (${(10000/results.bulkOperations.jsonbAccess).toFixed(0)} ops/sec)`);
  console.log(`  Property Access: ${results.bulkOperations.propertyAccess.toFixed(2)}ms (${(10000/results.bulkOperations.propertyAccess).toFixed(0)} ops/sec)`);

  console.log('\n💾 Memory Usage:');
  console.log(`  Creation Time:   ${memoryTest.duration.toFixed(2)}ms`);
  console.log(`  Heap Used:       ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total:      ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External:        ${(memoryDiff.external / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n✅ PERFORMANCE REQUIREMENTS CHECK:');
  const requirements = {
    entityCreation: 100, // < 100ms for 1000 entities
    jsonbHandling: 200,  // < 200ms for 1000 complex JSONB
    computedProps: 10,   // < 10ms for 1000 computations
    bulkOps: 50,         // < 50ms for 10000 operations
    memoryPerEntity: 1   // < 1KB per entity average
  };

  const avgEntityCreation = (results.entityCreation.customer + results.entityCreation.aiRequest + 
                            results.entityCreation.activityLog + results.entityCreation.history) / 4;
  const avgJsonbHandling = (results.jsonbHandling.customerPreferences + results.jsonbHandling.requestData) / 2;
  const avgComputedProps = (results.computedProperties.isExpired + results.computedProperties.totalDuration + 
                           results.computedProperties.isOverdue) / 3;
  const avgBulkOps = (results.bulkOperations.jsonbAccess + results.bulkOperations.propertyAccess) / 2;
  const memoryPerEntity = memoryDiff.heapUsed / 5000 / 1024; // KB per entity

  console.log(`  Entity Creation: ${avgEntityCreation.toFixed(2)}ms ${avgEntityCreation < requirements.entityCreation ? '✅' : '❌'} (< ${requirements.entityCreation}ms)`);
  console.log(`  JSONB Handling:  ${avgJsonbHandling.toFixed(2)}ms ${avgJsonbHandling < requirements.jsonbHandling ? '✅' : '❌'} (< ${requirements.jsonbHandling}ms)`);
  console.log(`  Computed Props:  ${avgComputedProps.toFixed(2)}ms ${avgComputedProps < requirements.computedProps ? '✅' : '❌'} (< ${requirements.computedProps}ms)`);
  console.log(`  Bulk Operations: ${avgBulkOps.toFixed(2)}ms ${avgBulkOps < requirements.bulkOps ? '✅' : '❌'} (< ${requirements.bulkOps}ms)`);
  console.log(`  Memory/Entity:   ${memoryPerEntity.toFixed(2)}KB ${memoryPerEntity < requirements.memoryPerEntity ? '✅' : '❌'} (< ${requirements.memoryPerEntity}KB)`);

  const allRequirementsMet = 
    avgEntityCreation < requirements.entityCreation &&
    avgJsonbHandling < requirements.jsonbHandling &&
    avgComputedProps < requirements.computedProps &&
    avgBulkOps < requirements.bulkOps &&
    memoryPerEntity < requirements.memoryPerEntity;

  console.log(`\n🎯 Overall Performance: ${allRequirementsMet ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    success: allRequirementsMet,
    results,
    summary: {
      avgEntityCreation,
      avgJsonbHandling,
      avgComputedProps,
      avgBulkOps,
      memoryPerEntity
    }
  };
}

// Run the performance test
if (require.main === module) {
  performanceTest()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Performance test failed:', error);
      process.exit(1);
    });
}

module.exports = { performanceTest };