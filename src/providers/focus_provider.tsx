/*
 * Copyright (c) 2025 Novumlogic Technologies Pvt Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { AnyNodeProps } from "@type/node_properties";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  useReducer,
} from "react";
import cloneDeep from "lodash.clonedeep";

export type FocusAction =
  | {
      type: "FOCUS_NODE";
      payload: {
        properties: AnyNodeProps;
      };
    }
  | {
      type: "CLEAR_FOCUS";
    };

const focusReducer = (
  focusedNodeProps: AnyNodeProps | null,
  action: FocusAction,
): AnyNodeProps | null => {
  let focusNodePropsCopy = cloneDeep(focusedNodeProps);

  switch (action.type) {
    case "FOCUS_NODE": {
      focusNodePropsCopy = action.payload.properties;
      break;
    }
    case "CLEAR_FOCUS": {
      focusNodePropsCopy = null;
      break;
    }
    default: {
      break;
    }
  }
  return focusNodePropsCopy;
};

export const FocusContext = createContext<{
  focusedNodeProps: AnyNodeProps | null;
  dispatch: Dispatch<FocusAction>;
}>({
  focusedNodeProps: null,
  dispatch: () => undefined,
});

export interface DatabaseProviderProps {
  children: ReactNode;
  focusNodeProps: AnyNodeProps | null;
}

const FocusProvider = ({
  children,
  focusNodeProps,
}: Readonly<DatabaseProviderProps>) => {
  const [state, dispatch] = useReducer(focusReducer, focusNodeProps);

  return (
    <FocusContext.Provider
      value={{
        focusedNodeProps: state,
        dispatch: dispatch,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export default FocusProvider;
