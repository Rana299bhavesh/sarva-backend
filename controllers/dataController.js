const Activity = require('../models/Activity');

exports.uploadData = async (req, res, next) => {
  try {
    const { records } = req.body; 
    
    
    const result = await Activity.insertMany(records, { ordered: false })
      .catch(err => {
       
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