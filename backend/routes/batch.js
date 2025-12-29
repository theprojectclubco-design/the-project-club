const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// GET all batches
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      batches: data
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batches'
    });
  }
});

// ⭐ NEW: GET single batch by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    res.json({
      success: true,
      batch: data
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch details'
    });
  }
});

// GET batch by ID with details (for registration page)
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      batch: data
    });
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch batch details'
    });
  }
});

module.exports = router;
