// MongoDB initialization script for SPOrTS
// This script runs when the MongoDB container starts for the first time

print('🚀 Initializing SPOrTS Database...');

// Switch to sports_db database
db = db.getSiblingDB('sports_db');

// Create application user
db.createUser({
  user: 'sports_user',
  pwd: 'sports_password',
  roles: [
    {
      role: 'readWrite',
      db: 'sports_db'
    }
  ]
});

print('👤 Created sports_user with readWrite permissions');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'venue_owner', 'admin']
        }
      }
    }
  }
});

db.createCollection('venues');

print('📊 Created collections: users, venues');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.venues.createIndex({ owner: 1 });

print('🔍 Created performance indexes');

print('✅ Database initialization completed successfully!');
