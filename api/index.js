import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// ============================================
// SERVERLESS CONFIGURATION FOR VERCEL
// ============================================
// This file is configured for Vercel serverless deployment
// Database queries are mocked to work without persistent connections
// Original database code is kept in /backend but NOT executed

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet());
app.use(cors({
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ============================================
// MOCK DATA (Replace database queries)
// ============================================
const mockDonors = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    blood_group: 'O+',
    phone: '9876543210',
    city: 'Mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    gender: 'male',
    age: 28,
    is_available: 1,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    blood_group: 'A+',
    phone: '9876543211',
    city: 'Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    gender: 'female',
    age: 32,
    is_available: 1,
    created_at: '2024-01-16T10:00:00Z'
  },
  {
    id: 3,
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    blood_group: 'B+',
    phone: '9876543212',
    city: 'Bangalore',
    district: 'Bangalore',
    state: 'Karnataka',
    gender: 'male',
    age: 26,
    is_available: 1,
    created_at: '2024-01-17T10:00:00Z'
  },
  {
    id: 4,
    name: 'Priya Sharma',
    email: 'priya@example.com',
    blood_group: 'AB+',
    phone: '9876543213',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    gender: 'female',
    age: 30,
    is_available: 1,
    created_at: '2024-01-18T10:00:00Z'
  }
];

const mockStudents = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', blood_group: 'O+', enrolled: '2024-01-01' },
  { id: 2, name: 'Bob Wilson', email: 'bob@example.com', blood_group: 'A+', enrolled: '2024-01-02' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', blood_group: 'B+', enrolled: '2024-01-03' }
];

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
  try {
    res.json({
      message: 'API working',
      version: '1.0.0',
      service: 'Blood Donation Platform API',
      environment: 'Vercel Serverless',
      timestamp: new Date().toISOString(),
      availableEndpoints: {
        health: '/health',
        donors: {
          list: 'GET /api/donors',
          available: 'GET /api/donors/available',
          getById: 'GET /api/donors/:id',
          search: 'POST /api/donors/search'
        },
        students: {
          list: 'GET /api/students',
          getById: 'GET /api/students/:id'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Root endpoint error',
      message: error.message
    });
  }
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/health', (req, res) => {
  try {
    res.json({
      ok: true,
      status: 'API is healthy',
      time: new Date().toISOString(),
      environment: 'Vercel Serverless',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
});

// ============================================
// API ROUTES - DONORS
// ============================================

// GET /api/donors - List all donors with optional filters
app.get('/api/donors', (req, res) => {
  try {
    const { blood_group, state, district, gender, age, limit } = req.query;
    let filteredDonors = [...mockDonors];

    // Filter by blood group
    if (blood_group) {
      filteredDonors = filteredDonors.filter(
        d => d.blood_group.toUpperCase() === blood_group.toUpperCase()
      );
    }

    // Filter by state
    if (state) {
      filteredDonors = filteredDonors.filter(
        d => d.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    // Filter by district
    if (district) {
      filteredDonors = filteredDonors.filter(
        d => d.district.toLowerCase().includes(district.toLowerCase())
      );
    }

    // Filter by gender
    if (gender) {
      filteredDonors = filteredDonors.filter(
        d => d.gender === gender.toLowerCase()
      );
    }

    // Filter by age
    if (age) {
      const requestedAge = parseInt(age);
      if (!isNaN(requestedAge)) {
        filteredDonors = filteredDonors.filter(
          d => d.age === requestedAge
        );
      }
    }

    // Apply limit
    const pageLimit = Math.min(parseInt(limit) || 50, 500);
    filteredDonors = filteredDonors.slice(0, pageLimit);

    res.json({
      success: true,
      count: filteredDonors.length,
      filters: { blood_group, state, district, gender, age },
      data: filteredDonors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({
      error: 'Failed to fetch donors',
      message: error.message
    });
  }
});

// GET /api/donors/available - Get available donors
app.get('/api/donors/available', (req, res) => {
  try {
    const { blood_group, limit } = req.query;
    let availableDonors = mockDonors.filter(d => d.is_available === 1);

    if (blood_group) {
      availableDonors = availableDonors.filter(
        d => d.blood_group.toUpperCase() === blood_group.toUpperCase()
      );
    }

    const pageLimit = Math.min(parseInt(limit) || 50, 500);
    availableDonors = availableDonors.slice(0, pageLimit);

    res.json({
      success: true,
      message: 'Available donors retrieved successfully',
      count: availableDonors.length,
      data: availableDonors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching available donors:', error);
    res.status(500).json({
      error: 'Failed to fetch available donors',
      message: error.message
    });
  }
});

// GET /api/donors/:id - Get donor by ID
app.get('/api/donors/:id', (req, res) => {
  try {
    const donorId = parseInt(req.params.id);

    if (isNaN(donorId)) {
      return res.status(400).json({
        error: 'Invalid donor ID',
        message: 'ID must be a number'
      });
    }

    const donor = mockDonors.find(d => d.id === donorId);

    if (!donor) {
      return res.status(404).json({
        error: 'Donor not found',
        id: donorId
      });
    }

    res.json({
      success: true,
      data: donor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({
      error: 'Failed to fetch donor',
      message: error.message
    });
  }
});

// POST /api/donors/search - Search donors
app.post('/api/donors/search', (req, res) => {
  try {
    const { blood_group, state, district, limit } = req.body;

    if (!blood_group) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'blood_group is required'
      });
    }

    let results = mockDonors.filter(
      d => d.blood_group.toUpperCase() === blood_group.toUpperCase()
    );

    if (state) {
      results = results.filter(
        d => d.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (district) {
      results = results.filter(
        d => d.district.toLowerCase().includes(district.toLowerCase())
      );
    }

    const pageLimit = Math.min(parseInt(limit) || 50, 500);
    results = results.slice(0, pageLimit);

    res.json({
      success: true,
      query: { blood_group, state, district },
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching donors:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// ============================================
// API ROUTES - STUDENTS (SAMPLE ENDPOINT)
// ============================================

// GET /api/students - List all students
app.get('/api/students', (req, res) => {
  try {
    const { limit } = req.query;
    const pageLimit = Math.min(parseInt(limit) || 50, 500);
    const students = mockStudents.slice(0, pageLimit);

    res.json({
      success: true,
      count: students.length,
      data: students,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      error: 'Failed to fetch students',
      message: error.message
    });
  }
});

// GET /api/students/:id - Get student by ID
app.get('/api/students/:id', (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    if (isNaN(studentId)) {
      return res.status(400).json({
        error: 'Invalid student ID',
        message: 'ID must be a number'
      });
    }

    const student = mockStudents.find(s => s.id === studentId);

    if (!student) {
      return res.status(404).json({
        error: 'Student not found',
        id: studentId
      });
    }

    res.json({
      success: true,
      data: student,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      error: 'Failed to fetch student',
      message: error.message
    });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    message: 'The requested endpoint does not exist. Use GET / to see available endpoints.'
  });
});

// ============================================
// ERROR HANDLER (Must be last)
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// EXPORT FOR VERCEL SERVERLESS
// ============================================
export default app;
