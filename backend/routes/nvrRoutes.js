const express = require('express');
const router = express.Router();
const nvrController = require('../controllers/nvrController');

router.post('/connect', nvrController.connect);
router.post('/search', nvrController.search);
router.post('/download-token', nvrController.getDownloadToken);
router.get('/download', nvrController.download);

module.exports = router;
