// require('dotenv').config();
// const mongoose = require('mongoose');
// const xlsx = require('xlsx');
// const Activity = require('./models/Activity');
// const connectDB = require('./config/db');

// const seedDatabase = async () => {
//   try {
//     await connectDB();
//     console.log('Connected to Database. Starting data ingestion...');

//     const workbook = xlsx.readFile('./Savra_TeacherDataSet.xlsx'); 
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];

//     const rawData = xlsx.utils.sheet_to_json(worksheet, { cellDates: true });

//     if (rawData.length === 0) {
//       console.log('Excel file is empty.');
//       process.exit(0);
//     }

//     const formattedData = [];

//     for (let i = 0; i < rawData.length; i++) {
//       const row = rawData[i];
      
//       // Look for the exact capitalized keys from your Excel file
//       if (!row.Teacher_id && !row.Teacher_name) {
//         continue; // Skip empty rows
//       }

//       formattedData.push({
//         teacher_id: String(row.Teacher_id),                     // Mapped from Teacher_id
//         teacher_name: String(row.Teacher_name),                 // Mapped from Teacher_name
//         activity_type: String(row.Activity_type).toLowerCase().trim(), // Ensure lowercase ('lesson', 'quiz')
//         subject: String(row.Subject),                           // Mapped from Subject
//         class: String(row.Grade),                               // Mapped from Grade
//         created_at: row.Created_at ? new Date(row.Created_at) : new Date()
//       });
//     }

//     console.log(`Attempting to insert ${formattedData.length} valid records...`);
    
//     await Activity.insertMany(formattedData, { ordered: false })
//       .catch(err => {
//         if (err.code === 11000) {
//           console.log(`Ignored some duplicate records gracefully (Hidden Twist handled!).`);
//           return err.insertedDocs || [];
//         }
//         throw err;
//       });

//     console.log('✅ Database seeded successfully!');
//     process.exit(0);

//   } catch (error) {
//     console.error('❌ Error seeding database:', error.message);
//     process.exit(1);
//   }
// };

// seedDatabase();





require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Activity = require('./models/Activity');
const connectDB = require('./config/db');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to Database. Wiping old data to start fresh...');
    
    // Clear out the partial data so we don't have duplicates
    await Activity.deleteMany({});
    console.log('Old data cleared.');

    const workbook = xlsx.readFile('./Savra_TeacherDataSet.xlsx'); 
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = xlsx.utils.sheet_to_json(worksheet, { cellDates: true });

    if (rawData.length === 0) {
      console.log('Excel file is empty.');
      process.exit(0);
    }

    const formattedData = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row.Teacher_id && !row.Teacher_name) continue;

      // TRANSLATION LOGIC
      let rawType = String(row.Activity_type).toLowerCase().trim();
      let mappedType = 'lesson'; // Default fallback
      
      if (rawType.includes('quiz')) mappedType = 'quiz';
      if (rawType.includes('question paper') || rawType.includes('assessment')) mappedType = 'assessment';
      if (rawType.includes('lesson')) mappedType = 'lesson';

      formattedData.push({
        teacher_id: String(row.Teacher_id),
        teacher_name: String(row.Teacher_name),
        activity_type: mappedType, // Now perfectly translates to the exact words we need
        subject: String(row.Subject),
        class: String(row.Grade),
        created_at: row.Created_at ? new Date(row.Created_at) : new Date()
      });
    }

    console.log(`Attempting to insert ${formattedData.length} perfectly mapped records...`);
    
    await Activity.insertMany(formattedData, { ordered: false })
      .catch(err => {
        if (err.code === 11000) return err.insertedDocs || [];
        throw err;
      });

    console.log('✅ Database seeded successfully with correct terminology!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();