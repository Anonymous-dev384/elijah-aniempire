const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/socialController');

router.get('/feed',                    ctrl.getFeed);
router.post('/posts',                  ctrl.createPost);
router.post('/posts/:id/like',         ctrl.toggleLike);
router.post('/posts/:id/save',         ctrl.toggleSave);
router.post('/posts/:id/share',        ctrl.sharePost);
router.get('/posts/:id/comments',     ctrl.getComments);
router.post('/posts/:id/comments',     ctrl.addComment);
router.post('/posts/:id/poll-vote',    ctrl.pollVote);

module.exports = router;
