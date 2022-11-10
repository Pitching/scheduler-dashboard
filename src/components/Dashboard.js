import React, { Component } from "react";
import Loading from "./Loading";
import classnames from "classnames";
import Panel from "./Panel";
import axios from "axios";
import { getTotalInterviews, getLeastPopularTimeSlot, getMostPopularTimeSlot, getInterviewsPerDay, getMostPopularDay } from "helpers/selectors";
import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    
    
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      })
    })
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    if (focused) {
      this.setState({ focused });
    }
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState => 
          setInterview(previousState, data.id, data.interview));
      };
    };
  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    })
    )
  }

  render() {
    const panels = (this.state.focused ? data.filter(each => this.state.focused === each.id) : data).map(each => {
      return (
        <Panel
          key={each.id}
          label={each.label}
          value={each.getValue(this.state)}
          onSelect={event => this.selectPanel(each.id)}
        />
      )
    })
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
    });

    if (this.state.loading) {
      return <Loading />;
    }

    return <main className={dashboardClasses}>
      {panels}
    </main>;
  }
}

export default Dashboard;
