const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/users.controller');
const auth = require('../middlewares/auth.users')
const multer = require('multer');
const { saveImageData } = require('../controllers/images.controller');

const upload = multer();
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Email is not valid'),
        body('fullname.firstname').isLength({ min: 3 }).withMessage('First name must be at least 3 characters long'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    userController.registerUser
);

router.post( '/login', [
        body('email').isEmail().withMessage('Email is not valid'),
        body('password').notEmpty().withMessage('password is required'),
    ],
    userController.loginUser
);

// router.post(
//     '/save-image',
//     auth,
//     [
//         body('latitude').isNumeric().withMessage('Latitude must be a number'),
//         body('longitude').isNumeric().withMessage('Longitude must be a number'),
//         body('timestamp').isISO8601().withMessage('Invalid timestamp format'),
//         body('imageUrl').notEmpty().withMessage('Image URL is required'),
//          // Convert buffer to base64 (optional, if saving in MongoDB)
//          const imageUrl = `data:image/png;base64,${req.file.buffer.toString('base64')}`;
//     ],
//     userController.uploadImage
// )
router.post(
    '/save-image',
    auth,
    upload.single('image'), // Handle image upload
    [
        body('latitude').isNumeric().withMessage('Latitude must be a number'),
        body('longitude').isNumeric().withMessage('Longitude must be a number'),
        body('timestamp').isISO8601().withMessage('Invalid timestamp format'),
        body('imageUrl').notEmpty().withMessage('Image URL is required'),
    ],
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Image file is required' });
        }
        req.body.imageUrl = `data:image/png;base64,${req.file.buffer.toString('base64')}`;
        next();
    },
    userController.uploadImage
);

router.get('/protected', auth, (req, res) => {
    res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
});
module.exports = router;
