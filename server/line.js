var request = require('request')
var azure = require('azure-storage')
var wkx = require('wkx')

var tableSvc = azure.createTableService()



var shapeWKBOptions = {
    url: 'https://api.at.govt.nz/v2/gtfs/shapes/geometry/',
    headers: {
        'Ocp-Apim-Subscription-Key': process.env.atApiKey
    }
}

var line = {
    getLine: function(req, res) {
        var query = new azure.TableQuery()
            .where('route_short_name eq ?', req.params.line)
        tableSvc.queryEntities('routeShapes', query, null, function(err, result, response){
            if (err) {
                return reject(err)
            }
            var results = []
            result.entries.forEach(function(route){
                results.push({
                    route_id: route.RowKey._,
                    route_long_name: route.route_long_name._,
                    route_short_name: route.route_short_name._,
                    shape_id: route.shape_id._,
                    route_type: route.route_type._
                })

            })
            res.send(results)
        })
    },
    getShape: function(req, res) {
        var newOpts = JSON.parse(JSON.stringify(shapeWKBOptions))
        newOpts.url += req.params.line
        request(newOpts, function(err, response, body){
            if (err) {
                res.send({
                    error: err
                })
                return
            }
            res.send(JSON.parse(body).response[0].the_geom)
        })  
    }
}

module.exports = line

