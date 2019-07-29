// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from 'react';
import ReactDOM from 'react-dom';
import { LoginPage } from './LoginPage';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<LoginPage />, div);
  ReactDOM.unmountComponentAtNode(div);
});
