import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Gogodynamo from '../lib/gogodynamo-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Gogodynamo.GogodynamoStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
