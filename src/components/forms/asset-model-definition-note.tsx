import { assetModelDefinitions, formatAssetModelExamples, type AssetModelKey } from "@/lib/asset-model";

export function AssetModelDefinitionNote({ assetType }: { assetType: AssetModelKey }) {
  const definition = assetModelDefinitions[assetType];

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900 shadow-soft">
      <p className="font-semibold text-slate-950">{definition.title} 定位</p>
      <p className="mt-1">{definition.definition}</p>
      <p className="mt-1 text-blue-800">{formatAssetModelExamples(assetType)}</p>
    </section>
  );
}
