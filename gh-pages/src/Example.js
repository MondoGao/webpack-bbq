/* eslint no-underscore-dangle:0 */
/* eslint react/prefer-stateless-function:0 */
/* eslint react/prop-types:0 */
import React, { Component } from 'react';

import styles from './client.css';
// https://commons.wikimedia.org/wiki/File:Bbq.jpg
import bbq from './bbq.jpg';

class Example extends Component {
  render() {
    const { children } = this.props;
    return (
      <div>
        <span className={styles.red}>{'<Example />'}</span>
        <div className={styles.img}>
          <img src={bbq} alt="bbq" />
        </div>
        {children}
      </div>
    );
  }
}

Example.getInitialCssText = () => styles.toString();

export default Example;
