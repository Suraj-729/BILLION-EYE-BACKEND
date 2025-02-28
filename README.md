# BILLION-EYE-BACKEND

# Agency Model

This module provides functions to interact with the `agencies`, `critical_agencies`, and `non_critical_agencies` collections in the MongoDB database. It includes functionality for creating new agency entries and ensuring data integrity through validation and hashing.

## Dependencies

- `mongodb`: MongoDB client for Node.js
- `bcrypt`: Library for hashing passwords

## Environment Variables

- `DB_CONNECT`: MongoDB connection URI

## Functions

### `getAgencyCollection`

```javascript
async function getCriticalCollection()

