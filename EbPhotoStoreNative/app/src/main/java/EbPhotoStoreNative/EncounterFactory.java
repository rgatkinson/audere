package EbPhotoStoreNative;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

public class EncounterFactory extends ViewModelProvider.NewInstanceFactory {

  public EncounterFactory() {
  }

  @NonNull
  @Override
  public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
    if (modelClass == EncounterViewModel.class) {
      return (T) new EncounterViewModel();
    }
    return null;
  }
}
