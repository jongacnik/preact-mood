var preact = require('preact')
var createCycle = require('lei-cycle')
var tweezer = require('tweezer.js')
var requestInterval = require('request-interval')
var inlineStyle = require('inline-style')

var styles = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  slide: (image, opacity) => ({
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    opacity: opacity,
    backgroundImage: 'url(' + image + ')',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  })
}

var fadeIn = function (el, duration) {
  return new tweezer({
    start: 0,
    end: 1000,
    duration: duration,
    easing: (t, b, c, d) => {
      if ((t/=d/2) < 1) return c/2*t*t + b
      return -c/2 * ((--t)*(t-2) - 1) + b
    }
  })
  .on('tick', value => {
    el.style.opacity = value / 1000
  })
}

var shuffle = function (array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

class Mood extends preact.Component {
  constructor (props, state) {
    super()
    var images = props.shuffle 
      ? shuffle(props.images)
      : props.images
    this.cycle = createCycle(images)
    this.tweezer = null
    this.setState({
      prev: '',
      current: this.cycle(),
      playing: true,
      speed: props.speed,
      fade: props.fade
    })

    this.play = () => {
      this.setState({ playing: true })
      this.interval && requestInterval.clear(this.interval)
      this.interval = requestInterval(this.state.speed, () => {
        this.setState({ 
          prev: this.state.current,
          current: this.cycle()
        })
      })
    }

    this.pause = () => {
      this.setState({ playing: false })
      this.interval && requestInterval.clear(this.interval)
    }
  }

  componentDidMount () {
    this.state.playing && this.play()
    this.tweezer = fadeIn(this.base.children[1], this.state.fade).begin()
    this.base.addEventListener('click', this.handleClick)
  }

  componentWillUnmount () {
    this.tweezer.stop()
    this.pause()
  }

  componentDidUpdate () {
    this.tweezer = fadeIn(this.base.children[1], this.state.fade).begin()
  }

  shouldComponentUpdate (props, state) {
    return this.state.current !== state.current
  }

  render (props, state) {
    return preact.h('div', { Style: inlineStyle(styles.root) }, 
      preact.h('div', { Style: inlineStyle(styles.slide(state.prev, 1)) }),
      preact.h('div', { Style: inlineStyle(styles.slide(state.current, 0)) })
    )
  }
}

module.exports = Mood
