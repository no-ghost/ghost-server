var express = require('express');
var router = express.Router();
const TextMsgsService = require('../services/textMsgs.service');

const { wrapAsync } = require('../middleware/errorHandler.middleware');
const { body, query } = require('express-validator');
const {
  validate,
  isObjectId,
} = require('../middleware/expressValidator.middleware');

const { isLoggedIn, hasRole } = require('../middleware/auth.middleware');

router.post(
  '/submit',
  isLoggedIn,
  hasRole('REVIEWEE'),
  validate([
    body('title').exists().withMessage('required').bail().isString(),
    body('type')
      .exists()
      .withMessage('required')
      .bail()
      .isIn(['TEXT_MSG', 'DATING_PROFILE']),
    body('additionalInfo').exists().withMessage('required').bail().isString(),
    body('imageURLs')
      .exists()
      .withMessage('required')
      .bail()
      .isArray()
      .notEmpty(),
  ]),
  wrapAsync(async (req, res) => {
    const { title, type, additionalInfo, imageURLs } = req.body;

    console.log(
      `Endpoint: "textMsgs/submit", recieved: ${JSON.stringify(req.body)}`,
    );

    await TextMsgsService.save(
      req.session.user,
      title,
      type,
      additionalInfo,
      imageURLs,
    );

    return res.status(200).send();
  }),
);

// DEPRECATING IF NOT NEEDED
// router.get(
//   '/retrieve',
//   isLoggedIn,
//   validate([
//     query('textMsgId')
//       .exists()
//       .withMessage('required')
//       .bail()
//       .custom(isObjectId),
//   ]),
//   wrapAsync(async (req, res) => {
//     const { textMsgId } = req.query;

//     console.log(`Endpoint: "textMsgs/retrieve", recieved: ${textMsgId}`);

//     const retrievedTextMsg = await TextMsgsService.retrieve(textMsgId);

//     const projectedTextMsg = {
//       revieweeObj: retrievedTextMsg.revieweeObj,
//       title: retrievedTextMsg.title,
//       type: retrievedTextMsg.type,
//       additionalInfo: retrievedTextMsg.additionalInfo,
//       imageURLs: retrievedTextMsg.imageURLs,
//       reviews: retrievedTextMsg.reviews,
//       status: retrievedTextMsg.status,
//     };

//     return res.json(projectedTextMsg);
//   }),
// );

router.post(
  '/review',
  isLoggedIn,
  hasRole('REVIEWER'),
  validate([
    body('textMsgId')
      .exists()
      .withMessage('required')
      .bail()
      .custom(isObjectId),
    body('reviewContent').exists().withMessage('required').bail().isString(),
  ]),
  wrapAsync(async (req, res) => {
    const { textMsgId, reviewContent } = req.body;

    console.log(
      `Endpoint: "textMsgs/review", recieved: ${JSON.stringify(req.body)}`,
    );

    await TextMsgsService.review(req.session.user, textMsgId, reviewContent);

    return res.status(200).send();
  }),
);

router.post(
  '/getNext',
  isLoggedIn,
  hasRole('REVIEWER'),
  validate([body('lastTextMsgId').optional().custom(isObjectId)]),
  wrapAsync(async (req, res) => {
    console.log(
      `Endpoint: "textMsgs/retrieve", recieved body: ${JSON.stringify(
        req.body,
      )}`,
    );

    const { lastTextMsgId } = req.body;

    // fetch next textMsg
    const retrievedTextMsg = await TextMsgsService.retrieveNext(
      req.session.user.userId,
      lastTextMsgId,
    );

    const projectedTextMsg = {
      revieweeObj: retrievedTextMsg.revieweeObj,
      title: retrievedTextMsg.title,
      type: retrievedTextMsg.type,
      additionalInfo: retrievedTextMsg.additionalInfo,
      imageURLs: retrievedTextMsg.imageURLs,
    };

    return res.json(projectedTextMsg);
  }),
);

router.get(
  '/reviews',
  isLoggedIn,
  hasRole('REVIEWEE'),
  wrapAsync(async (req, res) => {
    const userId = req.session.user.userId;
    console.log(req.session.user);
    const pastSubmissions = await TextMsgsService.retrieveSubmissionsForUser(
      userId,
    );
    return res.json(pastSubmissions);
  }),
);

router.post(
  '/flag',
  isLoggedIn,
  hasRole('REVIEWER'),
  validate([
    body('textMsgId')
      .exists()
      .withMessage('required')
      .bail()
      .custom(isObjectId),
    body('category')
      .exists()
      .withMessage('required')
      .bail()
      .isString()
      .isIn(['inappropriate', 'needs more context', 'skip']),
  ]),
  wrapAsync(async (req, res) => {
    console.log(
      `Endpoint: "textMsgs/flag", recieved body: ${JSON.stringify(req.body)}`,
    );

    const { textMsgId, category } = req.body;

    // fetch next textMsg
    const retrievedTextMsg = await TextMsgsService.flag(
      req.session.user.userId,
      textMsgId,
      category,
    );

    console.log(retrievedTextMsg);
    return res.json(retrievedTextMsg);
  }),
);

// TODO: find a way to keep this admin only
router.post(
  '/_clear',
  validate([
    body('reviewerId').exists().withMessage('required').bail(),
    body('seen').optional().isBoolean(),
    body('review').optional().isBoolean(),
    body('inappropriateFlag').optional().isBoolean(),
    body('needsMoreContextFlag').optional().isBoolean(),
    body('skippedFlag').optional().isBoolean(),
  ]),
  wrapAsync(async (req, res) => {
    console.log(
      `Endpoint: "_clear", recieved body: ${JSON.stringify(req.body)}`,
    );

    const {
      reviewerId,
      seen,
      review,
      inappropriateFlag,
      needsMoreContextFlag,
      skippedFlag,
    } = req.body;

    // fetch next textMsg
    const retrievedTextMsg = await TextMsgsService._clearReviewerFromAll(
      reviewerId,
      seen,
      review,
      inappropriateFlag,
      needsMoreContextFlag,
      skippedFlag,
    );

    console.log(retrievedTextMsg);
    return res.json(retrievedTextMsg);
  }),
);

module.exports = router;
