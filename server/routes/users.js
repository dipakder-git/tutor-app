import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Create or fetch user by name
router.post('/', async (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const cleanName = name.trim();

  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('name', cleanName)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingUser) {
      return res.json(existingUser);
    }

    // Otherwise create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ name: cleanName })
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error in /api/users:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default router;
