// @flow
import React, {Component} from 'react';

import OrganizationCard from './OrganizationCard';

import './OrganizationList.scss';

import type {Organizations, SummaryData} from '../types';
type State = {
  expandedEIN: number,
};

export default class OrganizationList extends Component {
  props: {
    loading: boolean,
    organizations: Organizations,
    summaryData: SummaryData,
  }

  state: State = {
    expandedEIN: 0,
  }

  handleCardClick = (expandedEIN: number) => {
    const oldExpandedEIN = this.state.expandedEIN;
    if (expandedEIN === oldExpandedEIN) {
      this.setState({expandedEIN: 0});
      return;
    }
    this.setState({expandedEIN});
  }

  render() {
    const {organizations, summaryData, loading} = this.props;
    const table = organizations.map((o) => {
      return (
        <OrganizationCard
          organization={o}
          key={o.ein}
          expanded={o.ein === this.state.expandedEIN}
          handleCardClick={this.handleCardClick}
          summaryData={summaryData}
        />
      );
    });
    return (
      <div className={"card-group-vertical " + (loading ? "loading" : "")}>
        {table}
      </div>
    );
  }
}
