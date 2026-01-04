const pool = require('../config/db');

exports.getAllStories = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        s.id, s.title, s.location, s.description, s.latitude, s.longitude,
        s.views_count, s.created_at,
        u.id as author_id, u.name as author_name
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ` AND (
        s.title ILIKE $1 OR 
        s.location ILIKE $1 OR 
        s.description ILIKE $1 OR 
        u.name ILIKE $1
      )`;
            params.push(`%${search}%`);
        }

        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);

        const stories = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            location: row.location,
            description: row.description,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            views_count: row.views_count,
            created_at: row.created_at,
            author: {
                id: row.author_id,
                name: row.author_name
            }
        }));

        res.json({
            success: true,
            data: stories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.getStoryById = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            'UPDATE stories SET views_count = views_count + 1 WHERE id = $1',
            [id]
        );

        const result = await pool.query(
            `SELECT 
        s.*, 
        u.id as author_id, u.name as author_name
       FROM stories s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cerita tidak ditemukan'
            });
        }

        const story = result.rows[0];

        res.json({
            success: true,
            data: {
                id: story.id,
                title: story.title,
                location: story.location,
                description: story.description,
                full_story: story.full_story,
                latitude: parseFloat(story.latitude),
                longitude: parseFloat(story.longitude),
                views_count: story.views_count,
                created_at: story.created_at,
                updated_at: story.updated_at,
                author: {
                    id: story.author_id,
                    name: story.author_name
                }
            }
        });
    } catch (error) {
        console.error('Get story by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.createStory = async (req, res) => {
    try {
        const { title, location, description, full_story, latitude, longitude } = req.body;
        const userId = req.user.id;

        if (!title || !location || !description || !full_story || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi'
            });
        }

        const result = await pool.query(
            `INSERT INTO stories (user_id, title, location, description, full_story, latitude, longitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
            [userId, title, location, description, full_story, latitude, longitude]
        );

        const story = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Cerita berhasil ditambahkan',
            data: {
                id: story.id,
                title: story.title,
                location: story.location,
                description: story.description,
                full_story: story.full_story,
                latitude: parseFloat(story.latitude),
                longitude: parseFloat(story.longitude),
                created_at: story.created_at,
                author: {
                    id: req.user.id,
                    name: req.user.name
                }
            }
        });
    } catch (error) {
        console.error('Create story error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.updateStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, location, description, full_story } = req.body;
        const userId = req.user.id;

        const checkResult = await pool.query(
            'SELECT user_id FROM stories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cerita tidak ditemukan'
            });
        }

        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses'
            });
        }

        const result = await pool.query(
            `UPDATE stories 
       SET title = COALESCE($1, title),
           location = COALESCE($2, location),
           description = COALESCE($3, description),
           full_story = COALESCE($4, full_story),
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
            [title, location, description, full_story, id]
        );

        const story = result.rows[0];

        res.json({
            success: true,
            message: 'Cerita berhasil diupdate',
            data: {
                id: story.id,
                title: story.title,
                location: story.location,
                description: story.description,
                full_story: story.full_story,
                updated_at: story.updated_at
            }
        });
    } catch (error) {
        console.error('Update story error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Cek ownership
        const checkResult = await pool.query(
            'SELECT user_id, title FROM stories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cerita tidak ditemukan'
            });
        }

        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Anda tidak memiliki akses'
            });
        }

        await pool.query('DELETE FROM stories WHERE id = $1', [id]);

        res.json({
            success: true,
            message: `Cerita "${checkResult.rows[0].title}" berhasil dihapus`
        });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.getMyStories = async (req, res) => {
    try {
        // const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;
        // const offset = (page - 1) * limit;

        // const countResult = await pool.query(
        //     'SELECT COUNT(*) FROM stories WHERE user_id = $1',
        //     [userId]
        // );
        // const total = parseInt(countResult.rows[0].count);

        const result = await pool.query(
            `SELECT 
                s.*,
                u.id as author_id, 
                u.name as author_name
            FROM stories s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = $1 
            ORDER BY s.created_at DESC`,
            // LIMIT $2 OFFSET $3`,
            [userId]
            // [userId, parseInt(limit), offset]
        );

        const stories = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            location: row.location,
            description: row.description,
            full_story: row.full_story,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            views_count: row.views_count,
            created_at: row.created_at,
            updated_at: row.updated_at,
            author: {
                id: row.author_id,
                name: row.author_name
            }
        }));

        res.json({
            success: true,
            data: stories,
            // pagination: {
            //     page: parseInt(page),
            //     limit: parseInt(limit),
            //     total,
            //     totalPages: Math.ceil(total / limit)
            // }
        });
    } catch (error) {
        console.error('Get my stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.getStoriesForMap = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
        s.id, s.title, s.location, s.description, s.full_story,
        s.latitude, s.longitude, s.views_count, s.created_at,
        u.id as author_id, u.name as author_name
       FROM stories s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
        );

        const stories = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            location: row.location,
            description: row.description,
            full_story: row.full_story,
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            views_count: row.views_count,
            created_at: row.created_at,
            author: {
                id: row.author_id,
                name: row.author_name
            }
        }));

        res.json({
            success: true,
            data: stories
        });
    } catch (error) {
        console.error('Get stories for map error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.incrementView = async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await pool.query(
            'SELECT id, views_count FROM stories WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cerita tidak ditemukan'
            });
        }

        const result = await pool.query(
            'UPDATE stories SET views_count = views_count + 1 WHERE id = $1 RETURNING views_count',
            [id]
        );

        res.json({
            success: true,
            message: 'View count berhasil diupdate',
            data: {
                views_count: result.rows[0].views_count
            }
        });
    } catch (error) {
        console.error('Increment view error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.getStats = async (req, res) => {
    try {
        const storiesCount = await pool.query('SELECT COUNT(*) FROM stories');
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');

        res.json({
            success: true,
            data: {
                total_stories: parseInt(storiesCount.rows[0].count),
                total_users: parseInt(usersCount.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan'
        });
    }
};

exports.getStoriesCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            'SELECT COUNT(*) as count FROM stories WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            data: {
                count: parseInt(result.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Get stories count error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil jumlah cerita'
        });
    }
};