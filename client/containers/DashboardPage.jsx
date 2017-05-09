// @flow
import _ from 'lodash';
import DocumentMeta from 'react-document-meta';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import update from 'immutability-helper';
import {browserHistory} from 'react-router';

import CheckboxFilters from '../components/CheckboxFilters';
import Navigation from '../components/Navigation';
import OrganizationTable from '../components/OrganizationTable';
import SortBar from '../components/SortBar';
import SelectedPopover from '../components/SelectedPopover';
import StateFilter from '../components/StateFilter';

import type {Organizations, SummaryData, FiltersData, Filters} from '../types';

type State = {
  error: string,
  filters: Filters,
  filtersData: FiltersData,
  loading: boolean,
  organizationsData: Organizations,
  summaryData: SummaryData,
  error?: Error,
};

let timeout; // Used below because I can't put timeout on state in this case

export default class DashboardPage extends Component {

  state: State = this.context.data || // Coming from the server
    window.__INITIAL_STATE__ ||
    // Equivalent to initial state
    {
      filters: {},
      filtersData: {},
      loading: true,
      organizationsData: [],
      summaryData: {},
      error: null,
    };

  componentDidMount() {
    if (this.state.organizationsData.length > 0) {
      return;
    }
    this.getOrganizations(0);
  }

  componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(prevState.filters, this.state.filters)) {
      this.getOrganizations(500);
    }
  }

  async getOrganizations(timer: number) {
    // Display loading indicator as soon as this is called
    this.setState({loading: true});
    
    // Clear existing timeouts to prevent call
    clearTimeout(timeout);
    
    // New timeout to call organizations
    timeout = setTimeout(async () => {
      const {filters} = this.state;
      // Build a query string with an array of key=value strings
      const queryStringArr: [] = [];
      _.each(filters, (v, k) => {
        if (_.isNil(v) || v.length === 0) {return;} // Do not include empty strings, arrays, null, or undefined
        let value = _.isArray(v) ? v.join(',') : v;
        // Order is an object so treat it a little different
        if (k === 'order') {
          if (Object.keys(v).length === 0) { return; }
          const values = _.map(v, (order: string, key: string) => (key + '-' + order));
          value = values.join(',');
        }
        queryStringArr.push(k + '=' + value);
      });
      const queryString = queryStringArr.join('&');
      browserHistory.push({
        search: '?' + queryString
      });
      try {
        const result = await(
          await fetch('/api/organizations?' + queryString, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          })
        ).json();
        this.setState({
          filtersData: result.filtersData,
          loading: false,
          organizationsData: result.organizationsData,
          summaryData: result.summaryData,
        });
      } catch (err) {
        this.setState({loading: false, error: err});
      }
    }, timer);
  }

  handleSelectState = (selectedState: string) => {
    const filters = Object.assign({}, this.state.filters);
    filters.state = filters.state ? filters.state.slice() : []; // Need to ensure it is a new array
    filters.state.push(selectedState);
    this.setState({filters});
  }

  handleSelectIncome = (e: DOMEvent) => {
    const filters = Object.assign({}, this.state.filters);
    const target = e.target;
    const value = parseInt(target.value, 10);
    filters.income_cd = filters.income_cd ? filters.income_cd.slice() : []; // Need to ensure it is a new array
    if (target.checked) {
      filters.income_cd.push(value);
    } else {
      _.pull(filters.income_cd, value);
    }
    this.setState({filters});
  }

  handleSelectNTEE = (e: DOMEvent) => {
    const filters = Object.assign({}, this.state.filters);
    const target = e.target;
    filters.ntee_cd = filters.ntee_cd ? filters.ntee_cd.slice() : []; // Need to ensure it is a new array
    if (target.checked) {
      filters.ntee_cd.push(target.value);
    } else {
      _.pull(filters.ntee_cd, target.value);
    }
    this.setState({filters});
  }

  handleNameChange = (e: DOMEvent) => {
    const filters = Object.assign({}, this.state.filters);
    const target = e.target;
    filters.name = target.value;
    this.setState({filters});
  }

  // Sorts but doesn't change the order
  // TODO: Make order an array and place new filter at beginning of array
  handleSortChange = (order: {}) => {
    let filters = Object.assign({}, this.state.filters);
    filters = update(filters, {order: {$merge: order}}); // Using immutability helper to help detect state
    this.setState({filters});
  }

  render() {
    const meta = {
      title: 'Export Tool',
      description: 'Description',
      auto: {
        ograph: true
      }
    };
    const {filtersData, organizationsData, filters, loading, summaryData} = this.state;
    return (
      <DocumentMeta {...meta}>
        <div className="bg-light">
          <div className="container">
            <Navigation name={filters.name} handleNameChange={this.handleNameChange}/>
          </div>
        </div>
        <div className="container py-3">
          <div className="row">
            <div className="col-sm-12 col-md-4">
              <h3 className="h6 text-muted">Filters</h3>
              <CheckboxFilters
                filter={filtersData.income_cd}
                handleSelect={this.handleSelectIncome}
                filterValues={filters.income_cd}
              />
              <StateFilter
                handleSelectState={this.handleSelectState}
                filter={filtersData.state}
                selectedStates={filters.state}
              />
              <CheckboxFilters
                filter={filtersData.ntee_cd}
                handleSelect={this.handleSelectNTEE}
                filterValues={filters.ntee_cd}
                beforeContent={true}
              />
            </div>
            <div className={"col-sm-12 col-md-8 " + (loading ? "loading" : "")}>
              <SortBar filters={filters} summaryData={summaryData} handleSortChange={this.handleSortChange} />
              <OrganizationTable organizations={organizationsData}/>
            </div>
          </div>
          {false && <SelectedPopover />}
        </div>
      </DocumentMeta>
    );
  }

  static contextTypes = {
    data: PropTypes.object
  }
}
