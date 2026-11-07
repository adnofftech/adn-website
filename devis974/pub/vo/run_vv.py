# Lance la démo VibeVoice. Le fichier de voix officiel fr-Spk0_man.pt a été inspecté (pickletools) :
# il ne référence que torch (tenseurs), OrderedDict, DynamicCache et BaseModelOutputWithPast.
# On lève weights_only uniquement pour ce fichier vérifié.
import runpy, sys, os, torch
VERIFIED = os.path.abspath("demo/voices/streaming_model/fr-Spk0_man.pt")
_load = torch.load
def load(f, *a, **k):
    if isinstance(f, str) and os.path.abspath(f) == VERIFIED: k["weights_only"] = False
    return _load(f, *a, **k)
torch.load = load
sys.argv = ["realtime_model_inference_from_file.py"] + sys.argv[1:]
runpy.run_path("demo/realtime_model_inference_from_file.py", run_name="__main__")
