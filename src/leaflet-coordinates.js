import L from 'leaflet';
import PropTypes from 'prop-types';
import './styles.css';
import {
	withLeaflet, 
	MapControl
} from 'react-leaflet';

const reactToCSS = require('react-style-object-to-css')

const coordinatesControlDefaultStyle = {
	width: '290px', 
	margin: '0',
	border: '1px solid rgba(0,0,0,0.2)',
	borderRadius: '4px',
	backgroundColor: 'rgba(255, 255, 255, 0.7)',
	outline: 'none',
	fontSize: '11px',
	boxShadow: 'none',
	color: '#333',
	padding: '2px 2px',
	minHeight: '18px',
	cursor: "pointer"
}

L.Control.CoordinateControl = L.Control.extend({
	_style: null,
	_coordinateButton: null,
	_coordinates: 'decimal',
	initialize: function(element) {
		this.options.position = element.position;
		
		this._coordinates = element.coordinates || 'decimal';

		if (element.style === undefined) {
			this._style = reactToCSS(coordinatesControlDefaultStyle);
		} else {
			this._style = reactToCSS(element.style);
		}
	},

	onAdd: function(map) {
		var coordinateButton = L.DomUtil.create('button');
		coordinateButton.setAttribute('style',this._style);
		coordinateButton.setAttribute('id', 'coordinate-control');

		coordinateButton.addEventListener('click', () => {
			if (this._coordinates === 'degrees') {
				this._coordinates = "mgrs"
			} 
			else if (this._coordinates === 'mgrs') {
				this._coordinates = "decimal"

			} else {
				this._coordinates = "degrees"
			}
		});

		map.on('mousemove', (e) => {
			if (this._coordinates === 'degrees') {
				coordinateButton.innerHTML = "<div id='coordinates-degrees'> <strong>Latitude: </strong>" +  this.convertDecimalLatToDegrees(e.latlng.lat)
				 + " <strong>Longitude: </strong> " + this.convertDecimalLngToDegrees(e.latlng.lng) + "</div>";
			} 
			else if (this._coordinates === 'mgrs') {
				coordinateButton.innerHTML = "<div id='coordinates-mgrs'> <strong>MGRS: </strong>" +  this.convertDDtoMGRS(e.latlng.lng, e.latlng.lat) + "</div>";
			} else {
				var lat = e.latlng.lat.toLocaleString('en-US', {minimumFractionDigits: 8, useGrouping:false});
				var lng = e.latlng.lng.toLocaleString('en-US', {minimumFractionDigits: 8, useGrouping:false});
				coordinateButton.innerHTML = "<div id=coordinates-decimal> <strong>Latitude: </strong>" + lat + "&nbsp; <strong>Longitude: </strong>" + lng + "</div>";
			}
		});


		this._coordinateButton = coordinateButton;
		return coordinateButton;
	},
	convertDecimalLatToDegrees: function(lat) {
		var dms = this.convertDDToDMS(lat, false);
		var dmsDeg = dms.deg.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
		var dmsMin = dms.min.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
		var dmsSec = dms.sec.toLocaleString('en-US', {minimumIntegerDigits: 2, minimumFractionDigits: 2, useGrouping:false});
		var dmsString = dmsDeg + 'º ' + dmsMin + '′ ' + dmsSec + '′′ ' + dms.dir; 
		return dmsString;
	},
	convertDecimalLngToDegrees: function(lng) {
		var dms = this.convertDDToDMS(lng, true)
		var dmsDeg = dms.deg.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
		var dmsMin = dms.min.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
		var dmsSec = dms.sec.toLocaleString('en-US', {minimumIntegerDigits: 2, minimumFractionDigits: 2, useGrouping:false});
		var dmsString = dmsDeg + 'º ' + dmsMin + '′ ' + dmsSec + '′′ ' + dms.dir; 
		return dmsString;
	},
	convertDDToDMS: function(D, lng) {
		return {
			dir : D<0?lng?'W':'S':lng?'E':'N',
			deg : 0|(D<0?D=-D:D),
			min : 0|D%1*60,
			sec :(0|D*60%1*6000)/100
		};
	},
	convertDDtoMGRS: function(lng, lat) { 
		var mgrs = require("mgrs")
		var mgrsString = (mgrs.forward([lng,lat]));
		mgrsString = mgrsString.substring(0,2) + " "
			+ mgrsString.substring(2,5) + " "
			+ mgrsString.substring(5,10) + " "
			+ mgrsString.substring(10);
		return mgrsString;	
	},
});

L.control.coordinateControl = (opts) => {
    return new L.Control.CoordinateControl({...opts});
}

class CoordinatesControl extends MapControl {

	control;

	constructor(props) {
		super(props);
	}

	createLeafletElement(props) {
		this.control = L.control.coordinateControl({...props});
		return this.control;
	}

	updateLeafletElement(fromProps, toProps) {
		if (fromProps !== toProps) {
			this.leafletElement._coordinates = toProps.coordinates

			return this.control;
		}
	}

}

export default withLeaflet(CoordinatesControl);

CoordinatesControl.propTypes = {
	style: PropTypes.element,
	coordinates: PropTypes.oneOf(['decimal', 'degrees', 'mgrs']),
	position: PropTypes.oneOf(['topright', 'topleft', 'bottomright', 'bottomleft'])
}
