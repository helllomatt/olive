const assert = require('assert')
const should = require('chai').should()
const event = require('../lib/event')

describe('Event System', function() {
    it('should create a new event', function() {
        new event('example')

        event.all.should.have.property('example')
    })

    it('add a listener to the event', function() {
        new event('example')
        event.get('example').listen(() => {
            event.get('example').listeners.should.have.lengthOf(1)
        })
    })

    it('should fire off an event with parameters', function() {
        new event('example')
        event.get('example').listen((name, age) => {
            name.should.equal('Matt')
            age.should.equal(27)
        })

        event.get('example').fire('Matt', 27)
    })

    it('try to add a listener to a non-existent event', function() {
        should.Throw(() => {
            event.get('asdf').listen(() => { })
        }, Error, `Event 'asdf' hasn't been instantiated yet.`)
    })
})