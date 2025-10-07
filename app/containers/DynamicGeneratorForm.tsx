'use client';

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setParameter } from '../store/slices/generatorSlice';
import { getOrderedParameters } from '../lib/models';
import type { ModelConfig, ParameterSchema } from '../lib/models/types';
import type { ImageValue } from '../utils/fileConversion';
import DynamicFormField from '../components/Generator/DynamicFormField';

interface DynamicGeneratorFormProps {
  currentModel: ModelConfig | null | undefined;
}

export default function DynamicGeneratorForm({
  currentModel,
}: DynamicGeneratorFormProps) {
  const dispatch = useAppDispatch();
  const parameters = useAppSelector((state) => state.generator.parameters);

  // Memoize ordered parameters to avoid re-sorting on every render
  const orderedParams = useMemo(() => {
    return currentModel ? getOrderedParameters(currentModel) : [];
  }, [currentModel]);

  // Memoize column groupings
  const leftColumnParams = useMemo(() => {
    return orderedParams.filter(([, schema]) => schema['x-grid-column'] === 1);
  }, [orderedParams]);

  const rightColumnParams = useMemo(() => {
    return orderedParams.filter(([, schema]) => schema['x-grid-column'] === 2);
  }, [orderedParams]);

  // Memoize parameter change handler
  const handleParameterChange = useCallback(
    (paramName: string, value: string | number | boolean | ImageValue | null) => {
      if (!currentModel) return;

      const schema = currentModel.schema.properties[paramName];
      const uiField = schema['x-ui-field'] || paramName;

      dispatch(setParameter({ name: uiField, value }));
    },
    [currentModel, dispatch]
  );

  // Memoize render function
  const renderParameter = useCallback(([paramName, schema]: [string, ParameterSchema]) => {
    if (!currentModel) return null;

    // Check conditional display based on x-depends-on
    if (schema['x-depends-on']) {
      const dependsOn = schema['x-depends-on'];
      const dependsValue = schema['x-depends-value'];
      const dependsOnSchema = currentModel.schema.properties[dependsOn];
      const dependsOnUiField = dependsOnSchema?.['x-ui-field'] || dependsOn;
      const currentValue = parameters[dependsOnUiField];

      // Check if dependency is met
      if (Array.isArray(dependsValue)) {
        if (!dependsValue.includes(currentValue as never)) {
          return null; // Don't render if dependency not met
        }
      } else if (currentValue !== dependsValue) {
        return null; // Don't render if dependency not met
      }
    }

    const uiField = schema['x-ui-field'] || paramName;
    const value = parameters[uiField] as string | number | boolean | ImageValue | null | undefined;
    const isRequired = currentModel.schema.required.includes(paramName);

    return (
      <div key={paramName}>
        <DynamicFormField
          paramName={paramName}
          schema={schema}
          value={value}
          onChange={(newValue) => handleParameterChange(paramName, newValue)}
          required={isRequired}
        />
      </div>
    );
  }, [currentModel, parameters, handleParameterChange]);

  // Early return after hooks
  if (!currentModel) {
    return (
      <div className="text-center text-gray-500 py-8">
        Выберите модель для начала работы
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="space-y-6">
        {leftColumnParams.map(renderParameter)}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {rightColumnParams.map(renderParameter)}
      </div>
    </div>
  );
}
