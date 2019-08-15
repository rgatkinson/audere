package EbPhotoStoreNative;

import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.lang.String;

import org.auderenow.ebphotostorenative.R;

public class PatientListAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int VIEW_HEADER = 1;

    private String[] mDataset;

    // Provide a reference to the views for each data item
    // Complex data items may need more than one view per item, and
    // you provide access to all the views for a data item in a view holder
    public static class HeaderViewHolder extends RecyclerView.ViewHolder {
        public HeaderViewHolder(View v) {
            super(v);
        }
    }

    // Provide a reference to the views for each data item
    // Complex data items may need more than one view per item, and
    // you provide access to all the views for a data item in a view holder
    public static class PatientViewHolder extends RecyclerView.ViewHolder {
        private TextView textName;
        private TextView textID;
        private TextView textStatus;
        private TextView textInfo;

        public PatientViewHolder(View v) {
            super(v);
            textName = (TextView) v.findViewById(R.id.textName);
            textID = (TextView) v.findViewById(R.id.textID);
            textStatus = (TextView) v.findViewById(R.id.textStatus);
            textInfo = (TextView) v.findViewById(R.id.textInfo);

            v.setOnTouchListener(new View.OnTouchListener() {
                @Override
                public boolean onTouch(View v, MotionEvent motionEvent) {
                    switch (motionEvent.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                    case MotionEvent.ACTION_POINTER_DOWN:
                        v.setAlpha(0.5f);
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_POINTER_UP:
                    case MotionEvent.ACTION_CANCEL:
                        v.setAlpha(1.0f);
                        break;
                    }
                    return true;
                }
            });

            v.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // startActivity(new Intent(this, PatientDetailActivity.class));
                }
            });
        }
    }

    public PatientListAdapter(String[] myDataset) {
        mDataset = myDataset;
    }

    // Create new views (invoked by the layout manager)
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        RecyclerView.ViewHolder vh;
        if (viewType == VIEW_HEADER) {
            // create a new view
            View v = (View) LayoutInflater.from(parent.getContext()).inflate(R.layout.patientheader, parent, false);

            vh = new HeaderViewHolder(v);
        } else {
            // create a new view
            View v = (View) LayoutInflater.from(parent.getContext()).inflate(R.layout.patientitem, parent, false);

            vh = new PatientViewHolder(v);
        }
        return vh;
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        try {
            if (holder instanceof PatientViewHolder) {
                PatientViewHolder vh = (PatientViewHolder) holder;
                vh.textName.setText(mDataset[position - 1]);
                vh.textID.setText(String.format("%03d", position - 1));
                vh.textStatus.setText("");
                vh.textInfo.setText("");
            } else if (holder instanceof HeaderViewHolder) {
                HeaderViewHolder vh = (HeaderViewHolder) holder;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    @Override
    public int getItemCount() {
        return mDataset.length + 1;
    }

    @Override
    public int getItemViewType(int position) {
        if (position == 0) {
            // This is where we add the header
            return VIEW_HEADER;
        }

        return super.getItemViewType(position);
    }
}
