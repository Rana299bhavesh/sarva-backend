const Activity = require('../models/Activity');

exports.uploadData = async (req, res, next) => {
  try {
    const { records } = req.body; // Array of JSON records parsed from XLSX on frontend
    
    // HIDDEN TWIST SOLUTION: Application level
    // ordered: false ensures that if a duplicate throws a unique constraint error, 
    // the rest of the batch continues inserting without crashing.
    const result = await Activity.insertMany(records, { ordered: false })
      .catch(err => {
        // Mongoose throws error 11000 for duplicate keys. We catch and ignore duplicates.
        if (err.code === 11000) return err.insertedDocs;
        throw err;
      });

    res.status(201).json({
      success: true,
      message: 'Data processed. Duplicates were safely ignored.',
      insertedCount: result ? result.length : 0
    });
  } catch (error) {
    next(error);
  }
};