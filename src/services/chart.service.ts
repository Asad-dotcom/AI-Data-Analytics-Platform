export const ChartService = {
  /**
   * Sanitizes and supplements the AI-generated chart configuration.
   * Maps y-keys to modern Tailwind-aligned color HEX palettes for Recharts rendering.
   */
  prepareChartConfig(config: unknown) {
    // Return a default config if input is invalid
    if (!config || typeof config !== 'object') {
      return {
        type: 'bar',
        xKey: 'name',
        yKeys: ['value'],
        colors: ['#3B82F6'], // Default blue
      };
    }

    const cfg = config as Record<string, unknown>;
    const type = ['bar', 'line', 'area', 'pie'].includes(cfg.type as string) ? (cfg.type as string) : 'bar';
    const xKey = (cfg.xKey as string) || 'name';
    const yKeys = Array.isArray(cfg.yKeys) ? (cfg.yKeys as string[]) : ['value'];

    // Modern, accessible color palette matching standard tailwind colors
    const colorPalette = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EF4444', // Red
      '#06B6D4', // Cyan
      '#EC4899', // Pink
    ];

    const colors = yKeys.map((_: string, index: number) => colorPalette[index % colorPalette.length]);

    return {
      type,
      xKey,
      yKeys,
      colors,
    };
  },
};
