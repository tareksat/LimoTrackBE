module.exports = function (err, req, res, next){
    res.status(500).send('internal server error');

    console.log(err);
}