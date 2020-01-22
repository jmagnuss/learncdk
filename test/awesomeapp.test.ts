import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Awesomeapp = require('../lib/awesomeapp-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Awesomeapp.AwesomeappStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
