import React, { Component } from 'react';
import { Button, Container, Row, Col } from 'reactstrap';
import Moment from 'moment'
import lodash from 'lodash'
import { extendMoment } from 'moment-range';
import { getGoogleCalendarEvents, dayFormat, getDescriptionIconColor } from '../resources/gcal'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

const moment = extendMoment(Moment);

class Calendar extends Component {
  constructor(props) {
    super(props)

    this.state = {
      date: moment()
    }
  }

  changeSelectedDate = (date) => {
    this.setState({
      ...this.state,
      date: date
    })
    this.props.onDayClick(date)
  }

  days() {
    var days = []
    var dayCounter = 0

    var { date } = this.state
    var { selectedDate, events } = this.props

    const mthDisplayRange = moment.range(
      moment(date).startOf('month').startOf('week'),
      moment(date).endOf('month').endOf('week')
    )

    for (let day of mthDisplayRange.by('day')) {
      let belongsToSameMonth = day.isSame(moment(date), 'month')

      const dayEvents = events ? events[moment(day).format(dayFormat)] : []
      const offSet = dayEvents ? Math.round((12 - dayEvents.length)/2) - 1: 0
      const sameDay = selectedDate.isSame(moment(day), 'day')

      days.push(
        <Col key={day.format('YYYYMMDD')} onClick={belongsToSameMonth ? () => this.props.onDayClick(day) : () => this.changeSelectedDate(day)}
          className={"embed-responsive embed-responsive-1by1 d-flex justify-content-center "+ (!belongsToSameMonth ? 'text-muted' : '')}>
          <Container>
            <Row>
              <Col className="d-flex justify-content-center" >
                <span className="fa-layers fa-fw" style={{marginTop: '.7em'}}>
                  {
                    sameDay ? <FontAwesomeIcon icon="circle" color="dodgerblue" size="2x" style={{marginTop: '-.35em', marginLeft: '-.175em'}} /> : ''
                  }
                  <span className={"fa-layers-text " + (sameDay ? 'text-white' : '')} data-fa-transform="shrink-8 down-3" style={{fontWeight: 900}}><h4>{day.format('D')}</h4></span>
                </span>
              </Col>
            </Row>
            <Row>
              <Col className="d-flex justify-content-center pt-1">
                {
                  dayEvents ? dayEvents.map((event, index) =>
                    <FontAwesomeIcon icon="circle" color={getDescriptionIconColor(event)} key={event.glink} />
                    ) : ''
                }
              </Col>
            </Row>
          </Container>
        </Col>)
    }

    return days;
  }

  dayHeaders() {
    var dayHeaders = []
    const { date } = this.state

    const wkRange = moment.range(moment(date).startOf('week'),moment(date).endOf('week'))

    for (let day of wkRange.by('day')) {
      dayHeaders.push(<Col key={day.format('YYYYMMDD')} className="dayHeader">{day.format('dd')}</Col>)
    }

    return dayHeaders;
  }

  previousMonth = (date) => {
    this.setState({
      ...this.state,
      date: moment(date).subtract(1, 'months')
    })
  }

  nextMonth = (date) => {
    this.setState({
      ...this.state,
      date: moment(date).add(1, 'months')
    })
  }

  monthDisplay() {
    const { date } = this.state

    const previousButton = <Button color="link" onClick={() => this.previousMonth(date)}><FontAwesomeIcon icon="arrow-circle-left" size="3x" /></Button>
    const nextButton = <Button color="link" onClick={() => this.nextMonth(date)}><FontAwesomeIcon icon="arrow-circle-right" size="3x" /></Button>

    return (
      <div>
        <Row className="text-center align-items-center">
          <Col xs="2" className="d-none d-sm-block">
            { previousButton }
          </Col>
          <Col>
            <h5 className="display-4">
              { moment(date).format('MMMM') }, <small className="text-muted">{ moment(date).format('YYYY') } </small>
            </h5>
          </Col>
          <Col xs="2" className="d-none d-sm-block">
            { nextButton }
          </Col>
        </Row>
        <Row className="text-center align-items-center">
          <Col xs={{size: 2, offset: 3}} className="d-block d-sm-none">
            { previousButton }
          </Col>
          <Col xs="2" className="d-block d-sm-none">
            { nextButton }
          </Col>
        </Row>
      </div>);
  }

  render() {
    return (
      <Container>
        {
          this.monthDisplay()
        }
        <Row className="text-center">
          {this.dayHeaders()}
        </Row>
        {
          lodash.chunk(this.days(), 7).map((week, index) =>
            <Row key={index}>
              { week }
            </Row>
          )
        }
      </Container>
    );
  }
}

export default Calendar;
